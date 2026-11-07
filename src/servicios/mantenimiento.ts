import type {
  BloqueoMantenimiento,
  FiltrosAgendaEncargado,
  ItemAgendaEncargado,
  ParametrosCrearBloqueo,
  ParametrosCrearReservaFija,
  Reserva,
  ReservaFija,
  RespuestaLista,
  RespuestaUno,
  ResultadoBloqueoMantenimiento,
} from '@/tipos';
import {
  MOTIVO_TURNO_EXPIRADO,
  esHoraEnPuntoValida,
  extraerDatosTurnoId,
  formatearDateTimeConZona,
} from '@/utils/calculoTurnos';
import { ErrorServicioAPI, simularRedAsync } from './apiCliente';
import { obtenerUsuariosMemoria, sincronizarUsuarioEnKVSiActivo } from './auth';
import { buscarEspacioMemoriaPorId, obtenerEspaciosMemoria } from './espacios';
import {
  construirGrillaEspacioSincrona,
  obtenerBloqueosMemoria,
  obtenerReservasFijasMemoria,
  obtenerReservasMemoria,
} from './reservas';

function rangosVigenciaSeSuperponen(
  desdeA: string,
  hastaA: string | null,
  desdeB: string,
  hastaB: string | null
): boolean {
  const finA = hastaA ?? '9999-12-31';
  const finB = hastaB ?? '9999-12-31';
  return desdeA <= finB && desdeB <= finA;
}

function rangosHorariosSeSuperponen(
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean {
  return inicioA < finB && inicioB < finA;
}

// Agenda del día para el encargado (todas las canchas)
export async function obtenerAgendaDelDia(
  fechaISO: string,
  filtros?: FiltrosAgendaEncargado
): Promise<RespuestaLista<ItemAgendaEncargado>> {
  await simularRedAsync(220);

  const espacios = obtenerEspaciosMemoria().filter((e) => {
    if (!e.activo) return false;
    if (filtros?.complejo && e.complejo !== filtros.complejo) return false;
    if (filtros?.espacioId && e.id !== filtros.espacioId) return false;
    return true;
  });

  const reservas = obtenerReservasMemoria();
  const bloqueos = obtenerBloqueosMemoria();
  const usuarios = obtenerUsuariosMemoria();
  const items: ItemAgendaEncargado[] = [];

  for (const espacio of espacios) {
    const grilla = construirGrillaEspacioSincrona(espacio.id, fechaISO);
    const bloqueosEspacioDia = bloqueos.filter(
      (b) => b.espacioId === espacio.id && b.fecha === fechaISO
    );

    for (const turno of grilla) {
      // Buscar si hubo una reserva marcada como ausente en ese turno (aunque en grilla haya quedado libre/expirado)
      const reservaDirecta = turno.reservaId
        ? (reservas.find((r) => r.id === turno.reservaId) ?? null)
        : (reservas.find(
            (r) =>
              r.espacioId === espacio.id &&
              r.turnoId === turno.id &&
              r.estado === 'ausente'
          ) ?? null);

      const esExpiradoSinActividad =
        turno.estado === 'mantenimiento' &&
        turno.motivoBloqueo === MOTIVO_TURNO_EXPIRADO &&
        !reservaDirecta;

      if (turno.estado === 'libre' && !reservaDirecta) {
        continue;
      }

      if (esExpiradoSinActividad) {
        continue;
      }

      if (filtros?.soloReservas && !reservaDirecta) {
        continue;
      }

      const jugador = reservaDirecta
        ? (usuarios.find((u) => u.id === reservaDirecta.usuarioId) ?? null)
        : null;

      const bloqueoCoincidente = bloqueosEspacioDia.find(
        (b) => b.inicio <= turno.inicio && b.fin > turno.inicio
      );

      const titularFijo =
        turno.estado === 'fijo' && turno.motivoBloqueo
          ? turno.motivoBloqueo.replace(/^Fijo —\s*/, '')
          : null;

      items.push({
        turno: { ...turno },
        espacioNombre: espacio.nombre,
        complejo: espacio.complejo,
        deporteId: espacio.deporteId,
        reserva: reservaDirecta ? { ...reservaDirecta } : null,
        estadoReserva: reservaDirecta ? reservaDirecta.estado : null,
        jugadorNombre: jugador?.nombre ?? null,
        jugadorTelefono: jugador?.telefono ?? null,
        jugadorAusencias: jugador ? jugador.ausencias : null,
        titularFijo,
        porLluvia: bloqueoCoincidente?.porLluvia ?? false,
      });
    }
  }

  items.sort((a, b) => {
    const cmpHora = a.turno.inicio.localeCompare(b.turno.inicio);
    if (cmpHora !== 0) return cmpHora;
    return a.turno.espacioId.localeCompare(b.turno.espacioId);
  });

  return {
    datos: items,
    meta: {
      total: items.length,
      pagina: 1,
      porPagina: 200,
    },
  };
}

// Marca "No se presentó" y le suma una falta al jugador
export async function marcarAusenciaReserva(reservaId: string): Promise<RespuestaUno<Reserva>> {
  await simularRedAsync(200);

  const reserva = obtenerReservasMemoria().find((r) => r.id === reservaId);
  if (!reserva) {
    throw new ErrorServicioAPI('RESERVA_NO_ENCONTRADA', 'No se encontró la reserva indicada.');
  }

  if (reserva.estado !== 'confirmada') {
    throw new ErrorServicioAPI(
      'ESTADO_INVALIDO',
      `Solo se puede marcar ausente una reserva confirmada (estado actual: ${reserva.estado}).`
    );
  }

  reserva.estado = 'ausente';

  const jugador = obtenerUsuariosMemoria().find((u) => u.id === reserva.usuarioId);
  if (jugador) {
    jugador.ausencias += 1;
    sincronizarUsuarioEnKVSiActivo(jugador);
  }

  return {
    datos: { ...reserva },
    meta: null,
  };
}

// Ingreso manual por si no le anda el QR al vecino
export async function registrarIngresoManualReserva(
  reservaId: string
): Promise<RespuestaUno<Reserva>> {
  await simularRedAsync(180);

  const reserva = obtenerReservasMemoria().find((r) => r.id === reservaId);
  if (!reserva) {
    throw new ErrorServicioAPI('RESERVA_NO_ENCONTRADA', 'No se encontró la reserva indicada.');
  }

  if (reserva.estado !== 'confirmada') {
    throw new ErrorServicioAPI(
      'ESTADO_INVALIDO',
      `La reserva no admite acreditación manual (estado actual: ${reserva.estado}).`
    );
  }

  reserva.estado = 'cumplida';
  reserva.ingresoEn = formatearDateTimeConZona(new Date());

  return {
    datos: { ...reserva },
    meta: null,
  };
}

export async function listarBloqueosMantenimiento(
  espacioId?: string
): Promise<RespuestaLista<BloqueoMantenimiento>> {
  await simularRedAsync(180);
  const bloqueos = obtenerBloqueosMemoria().filter((b) =>
    espacioId ? b.espacioId === espacioId : true
  );

  const ordenados = [...bloqueos].sort((a, b) =>
    `${b.fecha}T${b.inicio}`.localeCompare(`${a.fecha}T${a.inicio}`)
  );

  return {
    datos: ordenados.map((b) => ({ ...b })),
    meta: {
      total: ordenados.length,
      pagina: 1,
      porPagina: 50,
    },
  };
}

// Bloqueo por lluvia o mantenimiento (cancela reservas sin penalizar al vecino)
export async function crearBloqueoMantenimiento(
  datos: ParametrosCrearBloqueo
): Promise<RespuestaUno<ResultadoBloqueoMantenimiento>> {
  await simularRedAsync(260);

  const espacio = buscarEspacioMemoriaPorId(datos.espacioId);
  if (!espacio) {
    throw new ErrorServicioAPI('ESPACIO_NO_ENCONTRADO', 'El espacio seleccionado no existe.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
    throw new ErrorServicioAPI('FECHA_INVALIDA', 'La fecha debe tener formato AAAA-MM-DD.');
  }

  if (!esHoraEnPuntoValida(datos.inicio, false) || !esHoraEnPuntoValida(datos.fin, true)) {
    throw new ErrorServicioAPI(
      'HORARIO_INVALIDO',
      'El rango horario debe estar en horas exactas entre las 08:00 y las 24:00.'
    );
  }

  if (datos.inicio >= datos.fin) {
    throw new ErrorServicioAPI(
      'RANGO_HORARIO_INVALIDO',
      'La hora de finalización debe ser posterior a la hora de inicio.'
    );
  }

  const motivoLimpio = datos.motivo.trim();
  if (motivoLimpio.length < 4) {
    throw new ErrorServicioAPI(
      'MOTIVO_REQUERIDO',
      'Ingresá un motivo descriptivo para informar a los vecinos en la grilla.'
    );
  }

  const bloqueos = obtenerBloqueosMemoria();
  const nuevoBloqueo: BloqueoMantenimiento = {
    id: `blq-${datos.porLluvia ? 'lluvia' : 'mant'}-${Date.now().toString().slice(-5)}`,
    espacioId: datos.espacioId,
    fecha: datos.fecha,
    inicio: datos.inicio,
    fin: datos.fin,
    motivo: motivoLimpio,
    porLluvia: datos.porLluvia,
  };

  bloqueos.unshift(nuevoBloqueo);

  const reservasAfectadas: Reserva[] = [];
  for (const r of obtenerReservasMemoria()) {
    if (r.espacioId !== datos.espacioId || r.estado !== 'confirmada') {
      continue;
    }
    const infoTurno = extraerDatosTurnoId(r.turnoId, r.espacioId);
    if (!infoTurno || infoTurno.fechaISO !== datos.fecha) {
      continue;
    }
    if (datos.inicio <= infoTurno.inicioHHMM && datos.fin > infoTurno.inicioHHMM) {
      r.estado = 'cancelada';
      reservasAfectadas.push({ ...r });
    }
  }

  return {
    datos: {
      bloqueo: { ...nuevoBloqueo },
      reservasAfectadas,
    },
    meta: null,
  };
}

export async function eliminarBloqueoMantenimiento(
  bloqueoId: string
): Promise<RespuestaUno<{ eliminado: boolean; id: string }>> {
  await simularRedAsync(180);

  const bloqueos = obtenerBloqueosMemoria();
  const idx = bloqueos.findIndex((b) => b.id === bloqueoId);
  if (idx === -1) {
    throw new ErrorServicioAPI('BLOQUEO_NO_ENCONTRADO', 'No se encontró el bloqueo indicado.');
  }

  bloqueos.splice(idx, 1);

  return {
    datos: { eliminado: true, id: bloqueoId },
    meta: null,
  };
}

export async function listarReservasFijas(
  espacioId?: string
): Promise<RespuestaLista<ReservaFija>> {
  await simularRedAsync(180);
  const fijas = obtenerReservasFijasMemoria().filter((rf) =>
    espacioId ? rf.espacioId === espacioId : true
  );

  const ordenadas = [...fijas].sort((a, b) => {
    if (a.activa !== b.activa) return a.activa ? -1 : 1;
    if (a.dia !== b.dia) return a.dia - b.dia;
    return a.inicio.localeCompare(b.inicio);
  });

  return {
    datos: ordenadas.map((rf) => ({ ...rf })),
    meta: {
      total: ordenadas.length,
      pagina: 1,
      porPagina: 50,
    },
  };
}

export async function crearReservaFija(
  datos: ParametrosCrearReservaFija
): Promise<RespuestaUno<ReservaFija>> {
  await simularRedAsync(250);

  const espacio = buscarEspacioMemoriaPorId(datos.espacioId);
  if (!espacio) {
    throw new ErrorServicioAPI('ESPACIO_NO_ENCONTRADO', 'El espacio seleccionado no existe.');
  }

  const titularLimpio = datos.titular.trim();
  if (titularLimpio.length < 3) {
    throw new ErrorServicioAPI(
      'TITULAR_INVALIDO',
      'Indicá el nombre del grupo, escuela o club titular de la reserva fija.'
    );
  }

  if (!esHoraEnPuntoValida(datos.inicio, false) || !esHoraEnPuntoValida(datos.fin, true)) {
    throw new ErrorServicioAPI(
      'HORARIO_INVALIDO',
      'El horario de la reserva fija debe expresarse en horas exactas entre 08:00 y 24:00.'
    );
  }

  if (datos.inicio >= datos.fin) {
    throw new ErrorServicioAPI(
      'RANGO_HORARIO_INVALIDO',
      'La hora de fin debe ser mayor a la hora de inicio.'
    );
  }

  if (datos.hasta !== null && datos.hasta < datos.desde) {
    throw new ErrorServicioAPI(
      'VIGENCIA_INVALIDA',
      'La fecha de fin de vigencia no puede ser anterior a la fecha de inicio.'
    );
  }

  const fijas = obtenerReservasFijasMemoria();
  const conflicto = fijas.find(
    (rf) =>
      rf.activa &&
      rf.espacioId === datos.espacioId &&
      rf.dia === datos.dia &&
      rangosHorariosSeSuperponen(rf.inicio, rf.fin, datos.inicio, datos.fin) &&
      rangosVigenciaSeSuperponen(rf.desde, rf.hasta, datos.desde, datos.hasta)
  );

  if (conflicto) {
    throw new ErrorServicioAPI(
      'CONFLICTO_RESERVA_FIJA',
      `Ya existe una reserva fija activa en ese horario (${conflicto.titular}, ${conflicto.inicio} a ${conflicto.fin}).`
    );
  }

  const nuevaFija: ReservaFija = {
    id: `fij-${Date.now().toString().slice(-4)}`,
    espacioId: datos.espacioId,
    titular: titularLimpio,
    dia: datos.dia,
    inicio: datos.inicio,
    fin: datos.fin,
    desde: datos.desde,
    hasta: datos.hasta,
    activa: true,
  };

  fijas.unshift(nuevaFija);

  return {
    datos: { ...nuevaFija },
    meta: null,
  };
}

export async function alternarEstadoReservaFija(
  fijaId: string,
  activa: boolean
): Promise<RespuestaUno<ReservaFija>> {
  await simularRedAsync(200);

  const fijas = obtenerReservasFijasMemoria();
  const objetivo = fijas.find((rf) => rf.id === fijaId);
  if (!objetivo) {
    throw new ErrorServicioAPI(
      'RESERVA_FIJA_NO_ENCONTRADA',
      'No se encontró la reserva fija indicada.'
    );
  }

  if (activa) {
    const conflicto = fijas.find(
      (rf) =>
        rf.id !== fijaId &&
        rf.activa &&
        rf.espacioId === objetivo.espacioId &&
        rf.dia === objetivo.dia &&
        rangosHorariosSeSuperponen(rf.inicio, rf.fin, objetivo.inicio, objetivo.fin) &&
        rangosVigenciaSeSuperponen(rf.desde, rf.hasta, objetivo.desde, objetivo.hasta)
    );

    if (conflicto) {
      throw new ErrorServicioAPI(
        'CONFLICTO_RESERVA_FIJA',
        `No se puede reactivar porque se superpone con "${conflicto.titular}" (${conflicto.inicio} a ${conflicto.fin}).`
      );
    }
  }

  objetivo.activa = activa;

  return {
    datos: { ...objetivo },
    meta: null,
  };
}
