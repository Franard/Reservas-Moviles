import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarPrecioEspacio,
  alternarEspacioFavorito,
  listarComplejosDisponibles,
  listarDeportes,
  listarEspacios,
  obtenerEspacioPorId,
} from '@/servicios/espacios';
import { obtenerFavoritosLocales } from '@/servicios/storageLocal';
import type { FiltrosEspacio } from '@/tipos';
import { useAuth } from './useAuth';

export function useDeportes() {
  return useQuery({
    queryKey: ['deportes'],
    queryFn: async () => {
      const respuesta = await listarDeportes();
      return respuesta.datos;
    },
  });
}

export function useFavoritosIds(): string[] {
  const { usuario } = useAuth();
  const { data: favoritosInvitado } = useQuery({
    queryKey: ['favoritos-locales'],
    queryFn: () => obtenerFavoritosLocales(),
    enabled: !usuario,
    initialData: () => obtenerFavoritosLocales(),
  });

  if (usuario) {
    return usuario.espaciosFavoritos;
  }
  return favoritosInvitado ?? [];
}

export function useEspacios(filtros?: FiltrosEspacio) {
  const favoritosIds = useFavoritosIds();

  const filtrosResueltos = useMemo<FiltrosEspacio | undefined>(() => {
    if (!filtros) return undefined;
    return {
      ...filtros,
      favoritosIds: filtros.soloFavoritos ? favoritosIds : undefined,
    };
  }, [filtros, favoritosIds]);

  return useQuery({
    queryKey: ['espacios', filtrosResueltos ?? null],
    queryFn: async () => {
      const respuesta = await listarEspacios(filtrosResueltos);
      return respuesta.datos;
    },
  });
}

export function useEspacioDetalle(id: string) {
  return useQuery({
    queryKey: ['espacio', id],
    queryFn: async () => {
      const respuesta = await obtenerEspacioPorId(id);
      return respuesta.datos;
    },
    enabled: Boolean(id),
  });
}

export function useComplejosDisponibles(): string[] {
  return useMemo(() => listarComplejosDisponibles(), []);
}

export function useAlternarFavorito() {
  const queryClient = useQueryClient();
  const { usuario, actualizarUsuarioSesion } = useAuth();

  return useMutation({
    mutationFn: async (espacioId: string) => {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const respuesta = await alternarEspacioFavorito(espacioId, usuario?.id ?? null);
      return respuesta.datos;
    },
    onSuccess: (datos) => {
      if (datos.usuarioActualizado) {
        actualizarUsuarioSesion(datos.usuarioActualizado);
      } else {
        queryClient.setQueryData(['favoritos-locales'], datos.espaciosFavoritos);
      }
      void queryClient.invalidateQueries({ queryKey: ['espacios'] });
    },
  });
}

export function useActualizarPrecioEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { espacioId: string; nuevoPrecioPorHora: number }) => {
      const respuesta = await actualizarPrecioEspacio(
        variables.espacioId,
        variables.nuevoPrecioPorHora
      );
      return respuesta.datos;
    },
    onSuccess: (espacioActualizado) => {
      void queryClient.invalidateQueries({ queryKey: ['espacios'] });
      void queryClient.invalidateQueries({ queryKey: ['espacio', espacioActualizado.id] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
    },
  });
}
