import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crearReserva, obtenerDisponibilidadEspacio } from '@/servicios/reservas';
import type { DiaCalendarioGrilla } from '@/tipos';
import { generarVentanaSieteDias, resumirDisponibilidadDia } from '@/utils/calculoTurnos';

export function useVentanaSieteDias(): DiaCalendarioGrilla[] {
  return useMemo(() => generarVentanaSieteDias(), []);
}

export function useDisponibilidad(espacioId: string, fechaISO: string) {
  const consulta = useQuery({
    queryKey: ['disponibilidad', espacioId, fechaISO],
    queryFn: async () => {
      const respuesta = await obtenerDisponibilidadEspacio(espacioId, fechaISO);
      return respuesta.datos;
    },
    enabled: Boolean(espacioId && fechaISO),
  });

  const resumenDia = useMemo(
    () => resumirDisponibilidadDia(consulta.data ?? []),
    [consulta.data]
  );

  return {
    ...consulta,
    resumenDia,
  };
}

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (parametros: {
      espacioId: string;
      turnoId: string;
      fechaISO: string;
      inicioHHMM: string;
      usuarioId: string;
      cantidadPersonas: number;
    }) => {
      const respuesta = await crearReserva(parametros);
      return respuesta.datos;
    },
    onSuccess: (_reserva, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['disponibilidad', variables.espacioId, variables.fechaISO],
      });
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
    },
  });
}
