import { Platform } from 'react-native';
import type { ReservaDetallada } from '@/tipos';

// Import dinámico para que no rompa en web
let Notifications: typeof import('expo-notifications') | null = null;

try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  }
} catch {
  // En Expo Go de Android no están disponibles los módulos nativos de push remotos
  Notifications = null;
}

const CANAL_ID = 'deportes-villaguay-turnos';

// Canal de notificaciones para Android y pedido de permisos
export async function configurarNotificacionesAsync(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL_ID, {
        name: 'Recordatorios y Avisos de Canchas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B5E20',
        sound: 'default',
      });
    }

    const { status: statusExistente } = await Notifications.getPermissionsAsync();
    let statusFinal = statusExistente;

    if (statusExistente !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    return statusFinal === 'granted';
  } catch (error) {
    console.warn('[Notificaciones] Error al configurar permisos/canales:', error);
    return false;
  }
}

// Recordatorio 2 horas antes de que empiece el turno
export async function programarRecordatorioTurnoAsync(
  reserva: ReservaDetallada
): Promise<string | null> {
  if (!Notifications || Platform.OS === 'web') return null;

  try {
    const tienePermiso = await configurarNotificacionesAsync();
    if (!tienePermiso) return null;

    const fechaHoraTurnoStr = `${reserva.fechaISO}T${reserva.inicio}:00-03:00`;
    const momentoTurno = new Date(fechaHoraTurnoStr).getTime();
    const ahora = Date.now();

    const DOS_HORAS_MS = 2 * 60 * 60 * 1000;
    const momentoNotificacion = momentoTurno - DOS_HORAS_MS;

    let triggerSeconds = Math.round((momentoNotificacion - ahora) / 1000);

    // Si falta poco para el turno, disparamos a los 15 segundos
    if (triggerSeconds <= 0) {
      triggerSeconds = 15;
    }

    const idNotificacion = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚽ Recordatorio: Tu turno en ${reserva.espacioNombre}`,
        body: `Recordá que tu turno es hoy a las ${reserva.inicio} hs en ${reserva.complejo}. Tené a mano tu código QR para ingresar.`,
        data: {
          reservaId: reserva.id,
          tipo: 'recordatorio_turno',
          espacioId: reserva.espacioId,
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    return idNotificacion;
  } catch (error) {
    console.warn('[Notificaciones] Error al programar recordatorio:', error);
    return null;
  }
}

// Si cancela la reserva, borramos el recordatorio programado
export async function cancelarRecordatorioTurnoAsync(reservaId: string): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;

  try {
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of programadas) {
      const data = notif.content.data as { reservaId?: string } | undefined;
      if (data?.reservaId === reservaId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn('[Notificaciones] Error al cancelar recordatorios de reserva:', error);
  }
}

// Aviso inmediato si se suspende por lluvia o mantenimiento
export async function notificarSuspensionPorLluviaAsync(
  canchaNombre: string,
  motivo: string
): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;

  try {
    await configurarNotificacionesAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌧️ Suspensión de turno: ${canchaNombre}`,
        body: `La administración municipal suspendió la jornada por: "${motivo}". El turno no computa penalización.`,
        data: { tipo: 'suspension_lluvia' },
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notificaciones] Error al notificar suspensión por lluvia:', error);
  }
}

// Aviso si se libera un turno en una cancha guardada en favoritos
export async function notificarTurnoLiberadoFavoritoAsync(
  canchaNombre: string,
  horario: string
): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;

  try {
    await configurarNotificacionesAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ¡Turno libre en ${canchaNombre}!`,
        body: `Se acaba de liberar el turno de las ${horario} hs en tu cancha favorita. Entrá para reservarlo antes que otro vecino.`,
        data: { tipo: 'turno_liberado' },
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notificaciones] Error al notificar turno liberado:', error);
  }
}
