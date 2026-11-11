import {
  MOCK_BLOQUEOS_MANTENIMIENTO,
  MOCK_RESERVAS,
  MOCK_RESERVAS_FIJAS,
} from '@/mocks/datosMock';
import {
  guardarMultiplesReservasOffline,
  guardarReservaOffline,
  obtenerBaseDatosAsync,
  obtenerReservaOfflinePorId,
  obtenerReservaOfflinePorQr,
  obtenerReservasOffline,
} from '@/db/sqlite';
import type {
  BloqueoMantenimiento,
  Reserva,
  ReservaDetallada,
  ReservaFija,
  RespuestaLista,
  RespuestaUno,
  ResultadoValidacionQr,
  ResumenMisReservas,
  Turno,
  Usuario,
} from '@/tipos';
import {
  calcularCancelableHasta,
  esFechaDentroDeVentana,
  esTurnoFuturoOVigente,
  evaluarVentanaCancelacion,
  extraerDatosTurnoId,
  formatearDateTimeConZona,
  formatearFechaISOLocal,
  generarGrillaDiaria,
} from '@/utils/calculoTurnos';
import { ErrorServicioAPI, simularRedAsync } from './apiCliente';
import { obtenerUsuariosMemoria, sincronizarUsuarioEnKVSiActivo } from './auth';
import { buscarEspacioMemoriaPorId } from './espacios';
import { verificarConexionDirectaAsync } from '@/hooks/useConectividad';
import {
  cancelarRecordatorioTurnoAsync,
  programarRecordatorioTurnoAsync,
} from './notificaciones';

export const MAX_RESERVAS_ACTIVAS_POR_USUARIO = 3;

const reservasMemoria: Reserva[] = MOCK_RESERVAS.map((r) => ({ ...r }));
const reservasFijasMemoria: ReservaFija[] = MOCK_RESERVAS_FIJAS.map((rf) => ({ ...rf }));
const bloqueosMemoria: BloqueoMantenimiento[] = MOCK_BLOQUEOS_MANTENIMIENTO.map((b) => ({ ...b }));

export function obtenerReservasMemoria(): Reserva[] {
  return reservasMemoria;
}

export function obtenerReservasFijasMemoria(): ReservaFija[] {
  return reservasFijasMemoria;
}

export function obtenerBloqueosMemoria(): BloqueoMantenimiento[] {
  return bloqueosMemoria;
}

// Arma la grilla del día en memoria
export function construirGrillaEspacioSincrona(
  espacioId: string,
  fechaISO: string,
  ahora: Date = new Date()
): Turno[] {
  const idLimpio = String(Array.isArray(espacioId) ? espacioId[0] : espacioId).trim();
  const espacio = buscarEspacioMemoriaPorId(idLimpio);
  if (!espacio || !espacio.activo) {
    throw new ErrorServicioAPI(
      'ESPACIO_NO_ENCONTRADO',
      'El espacio deportivo solicitado no existe o no se encuentra habilitado.'
    );
  }

  const fechaLimpia = fechaISO || formatearFechaISOLocal(ahora);

  const bloqueosDelDia = bloqueosMemoria.filter(
    (b) => b.espacioId === idLimpio && b.fecha === fechaLimpia
  );

  return generarGrillaDiaria(
    idLimpio,
    fechaLimpia,
    espacio.precioPorHora,
    reservasMemoria,
    reservasFijasMemoria,
    bloqueosDelDia,
    ahora
  );
}

// Agrega datos de la cancha y horario a la reserva
export function enriquecerReserva(reserva: Reserva, ahora: Date = new Date()): ReservaDetallada {
  const espacio = buscarEspacioMemoriaPorId(reserva.espacioId);
  const datosTurno = extraerDatosTurnoId(reserva.turnoId, reserva.espacioId);

  const fechaISO = datosTurno?.fechaISO ?? reserva.creadaEn.slice(0, 10);
  const inicio = datosTurno?.inicioHHMM ?? '08:00';
  const fin = datosTurno?.finHHMM ?? '09:00';
  const esFuturaOVigente = esTurnoFuturoOVigente(fechaISO, inicio, ahora);

  return {
    ...reserva,
    espacioNombre: espacio?.nombre ?? `Espacio ${reserva.espacioId}`,
    complejo: espacio?.complejo ?? 'Complejo Municipal',
    deporteId: espacio?.deporteId ?? 'dep-multiuso',
    superficie: espacio?.superficie ?? 'estándar',
    coordenadas: espacio?.coordenadas
      ? { ...espacio.coordenadas }
      : { latitud: -31.8642, longitud: -59.0281 },
    fechaISO,
    inicio,
    fin,
    precioPorHora: espacio?.precioPorHora ?? 0,
    esFuturaOVigente,
  };
}

// Cuenta las reservas activas (que todavía no terminaron)
export function contarReservasActivasVigentes(
  usuarioId: string,
  ahora: Date = new Date()
): number {
  let contador = 0;
  for (const r of reservasMemoria) {
    if (r.usuarioId !== usuarioId || r.estado !== 'confirmada') {
      continue;
    }
    const datosTurno = extraerDatosTurnoId(r.turnoId, r.espacioId);
    if (!datosTurno) continue;
    if (esTurnoFuturoOVigente(datosTurno.fechaISO, datosTurno.inicioHHMM, ahora)) {
      contador += 1;
    }
  }
  return contador;
}

export async function obtenerDisponibilidadEspacio(
  espacioId: string,
  fechaISO: string
): Promise<RespuestaLista<Turno>> {
  await simularRedAsync(200);

  const grilla = construirGrillaEspacioSincrona(espacioId, fechaISO);

  return {
    datos: grilla,
    meta: {
      total: grilla.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

export async function listarReservasUsuario(usuarioId: string): Promise<RespuestaLista<Reserva>> {
  await simularRedAsync(200);
  const delUsuario = reservasMemoria
    .filter((r) => r.usuarioId === usuarioId)
    .sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));

  return {
    datos: delUsuario.map((r) => ({ ...r })),
    meta: {
      total: delUsuario.length,
      pagina: 1,
      porPagina: 50,
    },
  };
}

// Guarda las reservas en SQLite para que se vean offline
export async function sincronizarReservasUsuarioEnSqlite(usuarioId: string): Promise<void> {
  const db = await obtenerBaseDatosAsync();
  if (!db) return;
  try {
    const delUsuario = reservasMemoria.filter((r) => r.usuarioId === usuarioId);
    await guardarMultiplesReservasOffline(db, delUsuario);
  } catch (error) {
    console.warn('[Reservas] No se pudo sincronizar SQLite offline:', error);
  }
}

export async function listarReservasDetalladasUsuario(
  usuarioId: string
): Promise<RespuestaUno<ResumenMisReservas>> {
  let listaBase: Reserva[] = [];

  try {
    await simularRedAsync(200);
    listaBase = reservasMemoria.filter((r) => r.usuarioId === usuarioId);
    // Sincronizar en SQLite en segundo plano
    void sincronizarReservasUsuarioEnSqlite(usuarioId);
  } catch (error) {
    // Si no hay red, leer las reservas guardadas en SQLite local
    const db = await obtenerBaseDatosAsync();
    if (db) {
      listaBase = await obtenerReservasOffline(db, usuarioId);
      if (listaBase.length === 0) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const ahora = new Date();

  const enriquecidas = listaBase.map((r) => enriquecerReserva(r, ahora));

  const proximas = enriquecidas
    .filter((r) => r.estado === 'confirmada' && r.esFuturaOVigente)
    .sort((a, b) => {
      const claveA = `${a.fechaISO}T${a.inicio}`;
      const claveB = `${b.fechaISO}T${b.inicio}`;
      return claveA.localeCompare(claveB);
    });

  const pasadas = enriquecidas
    .filter((r) => !(r.estado === 'confirmada' && r.esFuturaOVigente))
    .sort((a, b) => {
      const claveA = `${a.fechaISO}T${a.inicio}`;
      const claveB = `${b.fechaISO}T${b.inicio}`;
      return claveB.localeCompare(claveA);
    });

  return {
    datos: {
      proximas,
      pasadas,
      todas: [...proximas, ...pasadas],
      activasCount: proximas.length,
      maxActivasPermitidas: MAX_RESERVAS_ACTIVAS_POR_USUARIO,
    },
    meta: null,
  };
}

export async function obtenerReservaPorId(reservaId: string): Promise<RespuestaUno<Reserva>> {
  let reserva = reservasMemoria.find((r) => r.id === reservaId);

  if (!reserva) {
    const db = await obtenerBaseDatosAsync();
    if (db) {
      const offline = await obtenerReservaOfflinePorId(db, reservaId);
      if (offline) reserva = offline;
    }
  }

  if (!reserva) {
    throw new ErrorServicioAPI('RESERVA_NO_ENCONTRADA', 'No se encontró la reserva solicitada.');
  }
  return {
    datos: { ...reserva },
    meta: null,
  };
}

export async function obtenerReservaDetalladaPorId(
  reservaId: string
): Promise<RespuestaUno<ReservaDetallada>> {
  let reserva = reservasMemoria.find((r) => r.id === reservaId);

  if (!reserva) {
    const db = await obtenerBaseDatosAsync();
    if (db) {
      const offline = await obtenerReservaOfflinePorId(db, reservaId);
      if (offline) reserva = offline;
    }
  }

  if (!reserva) {
    throw new ErrorServicioAPI('RESERVA_NO_ENCONTRADA', 'No se encontró la reserva solicitada.');
  }
  return {
    datos: enriquecerReserva(reserva),
    meta: null,
  };
}

export async function crearReserva(parametros: {
  espacioId: string;
  turnoId: string;
  fechaISO: string;
  inicioHHMM: string;
  usuarioId: string;
  cantidadPersonas: number;
}): Promise<RespuestaUno<Reserva>> {
  await simularRedAsync(260);
  const ahora = new Date();

  const hayConexion = await verificarConexionDirectaAsync();
  if (!hayConexion) {
    throw new ErrorServicioAPI(
      'SIN_CONEXION',
      'No es posible confirmar reservas nuevas sin conexión a internet para evitar superposición de turnos.'
    );
  }

  const espacio = buscarEspacioMemoriaPorId(parametros.espacioId);
  if (!espacio || !espacio.activo) {
    throw new ErrorServicioAPI(
      'ESPACIO_NO_ENCONTRADO',
      'El espacio deportivo seleccionado no está disponible.'
    );
  }

  if (!esFechaDentroDeVentana(parametros.fechaISO, ahora)) {
    throw new ErrorServicioAPI(
      'FECHA_FUERA_DE_RANGO',
      'Solo se permiten reservas dentro de la ventana de los próximos 7 días.'
    );
  }

  if (
    !Number.isInteger(parametros.cantidadPersonas) ||
    parametros.cantidadPersonas < 1 ||
    parametros.cantidadPersonas > espacio.capacidad
  ) {
    throw new ErrorServicioAPI(
      'CAPACIDAD_INVALIDA',
      `La cantidad de personas debe estar entre 1 y ${espacio.capacidad} para ${espacio.nombre}.`
    );
  }

  // Máximo 3 reservas activas
  const activasVigentes = contarReservasActivasVigentes(parametros.usuarioId, ahora);
  if (activasVigentes >= MAX_RESERVAS_ACTIVAS_POR_USUARIO) {
    throw new ErrorServicioAPI(
      'LIMITE_RESERVAS_ALCANZADO',
      'Ya alcanzaste el máximo de 3 reservas activas simultáneas. Cancelá o utilizá una antes de reservar otro turno.'
    );
  }

  // Chequear si el turno sigue libre
  const grilla = construirGrillaEspacioSincrona(parametros.espacioId, parametros.fechaISO, ahora);
  const turnoObjetivo = grilla.find((t) => t.id === parametros.turnoId);

  if (!turnoObjetivo || turnoObjetivo.estado !== 'libre') {
    throw new ErrorServicioAPI(
      'TURNO_OCUPADO',
      turnoObjetivo?.motivoBloqueo
        ? `El turno no está disponible (${turnoObjetivo.motivoBloqueo}).`
        : 'Ese turno ya fue reservado por otra persona o no está disponible.'
    );
  }

  const numeroSecuencia = 1200 + reservasMemoria.length;
  const id = `res-${numeroSecuencia}`;
  const fechaCompacta = turnoObjetivo.fecha.replace(/-/g, '');
  const hh = turnoObjetivo.inicio.split(':')[0];
  const codigoQr = `VGY-${numeroSecuencia}-${parametros.espacioId.toUpperCase()}-${fechaCompacta}-${hh}`;

  const nueva: Reserva = {
    id,
    turnoId: turnoObjetivo.id,
    espacioId: parametros.espacioId,
    usuarioId: parametros.usuarioId,
    cantidadPersonas: parametros.cantidadPersonas,
    codigoQr,
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(ahora),
    cancelableHasta: calcularCancelableHasta(turnoObjetivo.fecha, turnoObjetivo.inicio),
  };

  reservasMemoria.unshift(nueva);

  // Recordatorio 2 hs antes
  void programarRecordatorioTurnoAsync(enriquecerReserva(nueva, ahora));

  // Guardo en SQLite para tenerla offline
  void obtenerBaseDatosAsync().then((db) => {
    if (db) void guardarReservaOffline(db, nueva);
  });

  return {
    datos: { ...nueva },
    meta: null,
  };
}

export async function cancelarReserva(
  reservaId: string,
  usuarioId: string
): Promise<
  RespuestaUno<{
    reserva: Reserva;
    fueCancelacionTardia: boolean;
    usuarioActualizado: Usuario | null;
  }>
> {
  await simularRedAsync(240);

  const reserva = reservasMemoria.find((r) => r.id === reservaId && r.usuarioId === usuarioId);
  if (!reserva) {
    throw new ErrorServicioAPI('RESERVA_NO_ENCONTRADA', 'No se encontró la reserva para cancelar.');
  }

  if (reserva.estado !== 'confirmada') {
    throw new ErrorServicioAPI(
      'ESTADO_NO_CANCELABLE',
      'Solo se pueden cancelar reservas que se encuentren en estado confirmada.'
    );
  }

  const ahora = new Date();
  const datosTurno = extraerDatosTurnoId(reserva.turnoId, reserva.espacioId);
  if (datosTurno && !esTurnoFuturoOVigente(datosTurno.fechaISO, datosTurno.inicioHHMM, ahora)) {
    throw new ErrorServicioAPI(
      'TURNO_FINALIZADO',
      'No es posible cancelar un turno cuyo horario ya finalizó.'
    );
  }

  const ventana = evaluarVentanaCancelacion(reserva.cancelableHasta, ahora);
  const fueCancelacionTardia = !ventana.sinAviso;

  reserva.estado = 'cancelada';

  // Cancelar recordatorios programados asociados a esta reserva
  void cancelarRecordatorioTurnoAsync(reservaId);

  // Sincronizar cancelación en SQLite
  void obtenerBaseDatosAsync().then((db) => {
    if (db) void guardarReservaOffline(db, reserva);
  });

  let usuarioActualizado: Usuario | null = null;
  const usuario = obtenerUsuariosMemoria().find((u) => u.id === usuarioId);
  if (usuario) {
    if (fueCancelacionTardia) {
      usuario.cancelacionesTardias += 1;
      sincronizarUsuarioEnKVSiActivo(usuario);
    }
    usuarioActualizado = {
      ...usuario,
      espaciosFavoritos: [...usuario.espaciosFavoritos],
    };
  }

  return {
    datos: {
      reserva: { ...reserva },
      fueCancelacionTardia,
      usuarioActualizado,
    },
    meta: null,
  };
}

export async function validarQrIngresoEnPuerta(parametros: {
  codigoQr: string;
  espacioIdEsperado?: string;
  fechaEsperadaISO?: string;
}): Promise<RespuestaUno<ResultadoValidacionQr>> {
  await simularRedAsync(180);

  const codigoLimpio = parametros.codigoQr.trim();
  if (!codigoLimpio) {
    throw new ErrorServicioAPI('QR_VACIO', 'El código QR leído está vacío o es inválido.');
  }

  let reserva = reservasMemoria.find((r) => r.codigoQr === codigoLimpio);
  if (!reserva) {
    const db = await obtenerBaseDatosAsync();
    if (db) {
      const offline = await obtenerReservaOfflinePorQr(db, codigoLimpio);
      if (offline) reserva = offline;
    }
  }

  if (!reserva) {
    throw new ErrorServicioAPI(
      'QR_INEXISTENTE',
      'El código QR escaneado no corresponde a ninguna reserva registrada en el municipio.'
    );
  }

  if (reserva.estado === 'cancelada') {
    throw new ErrorServicioAPI('QR_CANCELADO', 'Esta reserva fue cancelada previamente.');
  }

  if (reserva.estado === 'ausente') {
    throw new ErrorServicioAPI(
      'QR_AUSENTE',
      'Esta reserva ya había sido marcada como ausente en la planilla.'
    );
  }

  if (reserva.estado === 'cumplida' && reserva.ingresoEn) {
    throw new ErrorServicioAPI(
      'QR_YA_INGRESADO',
      `Este código ya registró ingreso a las ${reserva.ingresoEn.slice(11, 16)} hs.`
    );
  }

  const espacio = buscarEspacioMemoriaPorId(reserva.espacioId);
  if (parametros.espacioIdEsperado && reserva.espacioId !== parametros.espacioIdEsperado) {
    const espacioEsperado = buscarEspacioMemoriaPorId(parametros.espacioIdEsperado);
    throw new ErrorServicioAPI(
      'QR_OTRA_CANCHA',
      `El código corresponde a "${espacio?.nombre ?? reserva.espacioId}", no a "${espacioEsperado?.nombre ?? parametros.espacioIdEsperado}".`
    );
  }

  const datosTurno = extraerDatosTurnoId(reserva.turnoId, reserva.espacioId);
  const fechaEsperada = parametros.fechaEsperadaISO ?? formatearFechaISOLocal(new Date());
  const fechaReserva = datosTurno?.fechaISO ?? '';

  if (fechaReserva !== fechaEsperada) {
    throw new ErrorServicioAPI(
      'QR_OTRO_DIA',
      `El código QR pertenece a la fecha ${fechaReserva || 'distinta'}, no a la jornada de hoy (${fechaEsperada}).`
    );
  }

  reserva.estado = 'cumplida';
  reserva.ingresoEn = formatearDateTimeConZona(new Date());

  // Actualizar estado en SQLite
  void obtenerBaseDatosAsync().then((db) => {
    if (db) void guardarReservaOffline(db, reserva);
  });

  const jugador = obtenerUsuariosMemoria().find((u) => u.id === reserva.usuarioId);

  return {
    datos: {
      reserva: { ...reserva },
      espacioNombre: espacio?.nombre ?? reserva.espacioId,
      complejo: espacio?.complejo ?? 'Complejo Municipal',
      jugadorNombre: jugador?.nombre ?? 'Vecino registrado',
      fechaISO: fechaReserva,
      inicio: datosTurno?.inicioHHMM ?? '00:00',
      fin: datosTurno?.finHHMM ?? '01:00',
    },
    meta: null,
  };
}
