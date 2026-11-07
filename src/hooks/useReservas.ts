import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelarReserva,
  listarReservasDetalladasUsuario,
  obtenerReservaDetalladaPorId,
} from '@/servicios/reservas';
import { useAuth } from './useAuth';

export function useMisReservas() {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: ['mis-reservas', usuario?.id ?? 'invitado'],
    queryFn: async () => {
      if (!usuario) {
        return {
          proximas: [],
          pasadas: [],
          todas: [],
          activasCount: 0,
          maxActivasPermitidas: 3,
        };
      }
      const respuesta = await listarReservasDetalladasUsuario(usuario.id);
      return respuesta.datos;
    },
    enabled: Boolean(usuario?.id),
  });
}

export function useReservaDetalle(reservaId: string) {
  return useQuery({
    queryKey: ['reserva', reservaId],
    queryFn: async () => {
      const respuesta = await obtenerReservaDetalladaPorId(reservaId);
      return respuesta.datos;
    },
    enabled: Boolean(reservaId),
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();
  const { usuario, actualizarUsuarioSesion } = useAuth();

  return useMutation({
    mutationFn: async (reservaId: string) => {
      if (!usuario) {
        throw new Error('Debés iniciar sesión para cancelar una reserva.');
      }
      const respuesta = await cancelarReserva(reservaId, usuario.id);
      return respuesta.datos;
    },
    onSuccess: (resultado) => {
      if (resultado.usuarioActualizado) {
        actualizarUsuarioSesion(resultado.usuarioActualizado);
      }
      void queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      void queryClient.invalidateQueries({ queryKey: ['reserva', resultado.reserva.id] });
      void queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      void queryClient.invalidateQueries({ queryKey: ['agenda-dia'] });
    },
  });
}
