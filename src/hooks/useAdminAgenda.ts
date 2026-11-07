import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  alternarEstadoReservaFija,
  crearBloqueoMantenimiento,
  crearReservaFija,
  eliminarBloqueoMantenimiento,
  listarBloqueosMantenimiento,
  listarReservasFijas,
  marcarAusenciaReserva,
  obtenerAgendaDelDia,
  registrarIngresoManualReserva,
} from '@/servicios/mantenimiento';
import { validarQrIngresoEnPuerta } from '@/servicios/reservas';
import type {
  FiltrosAgendaEncargado,
  ParametrosCrearBloqueo,
  ParametrosCrearReservaFija,
} from '@/tipos';

export function useAgendaDia(fechaISO: string, filtros?: FiltrosAgendaEncargado) {
  return useQuery({
    queryKey: ['agenda-dia', fechaISO, filtros ?? null],
    queryFn: async () => {
      const respuesta = await obtenerAgendaDelDia(fechaISO, filtros);
      return respuesta.datos;
    },
    enabled: Boolean(fechaISO),
  });
}

export function useValidarQrPuerta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (parametros: {
      codigoQr: string;
      espacioIdEsperado?: string;
      fechaEsperadaISO?: string;
    }) => {
      const respuesta = await validarQrIngresoEnPuerta(parametros);
      return respuesta.datos;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['reserva'] });
    },
  });
}

export function useMarcarAusencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId: string) => {
      const respuesta = await marcarAusenciaReserva(reservaId);
      return respuesta.datos;
    },
    onSuccess: (reserva) => {
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['reserva', reserva.id] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
    },
  });
}

export function useRegistrarIngresoManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId: string) => {
      const respuesta = await registrarIngresoManualReserva(reservaId);
      return respuesta.datos;
    },
    onSuccess: (reserva) => {
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['reserva', reserva.id] });
    },
  });
}

export function useReservasFijas(espacioId?: string) {
  return useQuery({
    queryKey: ['reservas-fijas', espacioId ?? 'todas'],
    queryFn: async () => {
      const respuesta = await listarReservasFijas(espacioId);
      return respuesta.datos;
    },
  });
}

export function useCrearReservaFija() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: ParametrosCrearReservaFija) => {
      const respuesta = await crearReservaFija(datos);
      return respuesta.datos;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservas-fijas'] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
    },
  });
}

export function useAlternarReservaFija() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { fijaId: string; activa: boolean }) => {
      const respuesta = await alternarEstadoReservaFija(variables.fijaId, variables.activa);
      return respuesta.datos;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservas-fijas'] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
    },
  });
}

export function useBloqueosMantenimiento(espacioId?: string) {
  return useQuery({
    queryKey: ['bloqueos-mantenimiento', espacioId ?? 'todos'],
    queryFn: async () => {
      const respuesta = await listarBloqueosMantenimiento(espacioId);
      return respuesta.datos;
    },
  });
}

export function useCrearBloqueoMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: ParametrosCrearBloqueo) => {
      const respuesta = await crearBloqueoMantenimiento(datos);
      return respuesta.datos;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bloqueos-mantenimiento'] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
  });
}

export function useEliminarBloqueoMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bloqueoId: string) => {
      const respuesta = await eliminarBloqueoMantenimiento(bloqueoId);
      return respuesta.datos;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bloqueos-mantenimiento'] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
    },
  });
}
