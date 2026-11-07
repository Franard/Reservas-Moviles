import type {
  BloqueoMantenimiento,
  DatosTurnoExtraidos,
  DiaCalendarioGrilla,
  EstadoTurno,
  Reserva,
  ReservaFija,
  ResumenDisponibilidadDia,
  Turno,
  VentanaCancelacionInfo,
} from '@/tipos';

export const HORA_APERTURA_GRILLA = 8;
export const HORA_CIERRE_GRILLA = 24;
export const DIAS_VENTANA_GRILLA = 7;
export const HORAS_ANTICIPACION_CANCELACION = 4;

const DIAS_SEMANA_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const DIAS_SEMANA_LARGOS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;
const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export const MOTIVO_TURNO_EXPIRADO = 'Turno expirado';

// Pasa Date a "AAAA-MM-DD"
export function formatearFechaISOLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Crea un Date local desde fecha y hora
export function construirFechaHoraLocal(fechaISO: string, horaHHMM: string): Date {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const [hora, minuto] = horaHHMM.split(':').map(Number);
  return new Date(anio, mes - 1, dia, hora, minuto || 0, 0, 0);
}

// Suma días a una fecha base
export function obtenerFechaConOffset(diasOffset: number, base: Date = new Date()): string {
  const copia = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  copia.setDate(copia.getDate() + diasOffset);
  return formatearFechaISOLocal(copia);
}

// Busca la fecha de un día de la semana dentro de los 7 días
export function obtenerFechaDiaSemanaEnVentana(
  diaObjetivo: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  base: Date = new Date()
): string {
  for (let offset = 0; offset < DIAS_VENTANA_GRILLA; offset += 1) {
    const copia = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    copia.setDate(copia.getDate() + offset);
    if (copia.getDay() === diaObjetivo) {
      return formatearFechaISOLocal(copia);
    }
  }
  return formatearFechaISOLocal(base);
}

// Arma los próximos 7 días con etiquetas en español
export function generarVentanaSieteDias(base: Date = new Date()): DiaCalendarioGrilla[] {
  const dias: DiaCalendarioGrilla[] = [];

  for (let offset = 0; offset < DIAS_VENTANA_GRILLA; offset += 1) {
    const fecha = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    fecha.setDate(fecha.getDate() + offset);

    const fechaISO = formatearFechaISOLocal(fecha);
    const diaSemana = fecha.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const numeroDia = String(fecha.getDate()).padStart(2, '0');
    const nombreDiaCorto = DIAS_SEMANA_CORTOS[diaSemana];
    const nombreDiaLargo = DIAS_SEMANA_LARGOS[diaSemana];
    const mesCorto = MESES_CORTOS[fecha.getMonth()];
    const esHoy = offset === 0;
    const esManiana = offset === 1;

    const etiquetaCorta = esHoy
      ? 'Hoy'
      : esManiana
        ? 'Mañana'
        : `${nombreDiaCorto} ${numeroDia}`;

    const prefijo = esHoy ? 'Hoy · ' : esManiana ? 'Mañana · ' : '';
    const etiquetaLarga = `${prefijo}${nombreDiaCorto} ${numeroDia} ${mesCorto}`;

    dias.push({
      fechaISO,
      diaSemana,
      esHoy,
      esManiana,
      numeroDia,
      nombreDiaCorto,
      nombreDiaLargo,
      mesCorto,
      etiquetaCorta,
      etiquetaLarga,
    });
  }

  return dias;
}

// Se fija si una fecha cae dentro de los 7 días
export function esFechaDentroDeVentana(fechaISO: string, base: Date = new Date()): boolean {
  const inicioVentana = obtenerFechaConOffset(0, base);
  const finVentana = obtenerFechaConOffset(DIAS_VENTANA_GRILLA - 1, base);
  return fechaISO >= inicioVentana && fechaISO <= finVentana;
}

// Genera el id del turno (ej: tur-esp-01-2026-11-04-19)
export function construirTurnoId(espacioId: string, fechaISO: string, horaInicio: number): string {
  const hh = String(horaInicio).padStart(2, '0');
  return `tur-${espacioId}-${fechaISO}-${hh}`;
}

// Extrae fecha, hora y cancha desde el id del turno
export function extraerDatosTurnoId(
  turnoId: string,
  espacioIdFallback = '',
  anioFallback = new Date().getFullYear()
): DatosTurnoExtraidos | null {
  const matchCanonico = /^tur-(.+)-(\d{4}-\d{2}-\d{2})-(\d{2})$/.exec(turnoId.trim());
  if (matchCanonico) {
    const [, espacioId, fechaISO, hhStr] = matchCanonico;
    const horaInicio = Number(hhStr);
    if (Number.isNaN(horaInicio) || horaInicio < 0 || horaInicio > 23) {
      return null;
    }
    return {
      espacioId,
      fechaISO,
      horaInicio,
      inicioHHMM: `${String(horaInicio).padStart(2, '0')}:00`,
      finHHMM: `${String(horaInicio + 1).padStart(2, '0')}:00`,
    };
  }

  const matchCompacto = /^tur-(\d{2})(\d{2})-(\d{2})$/.exec(turnoId.trim());
  if (matchCompacto) {
    const [, mesStr, diaStr, hhStr] = matchCompacto;
    const horaInicio = Number(hhStr);
    if (Number.isNaN(horaInicio) || horaInicio < 0 || horaInicio > 23) {
      return null;
    }
    return {
      espacioId: espacioIdFallback,
      fechaISO: `${anioFallback}-${mesStr}-${diaStr}`,
      horaInicio,
      inicioHHMM: `${String(horaInicio).padStart(2, '0')}:00`,
      finHHMM: `${String(horaInicio + 1).padStart(2, '0')}:00`,
    };
  }

  return null;
}

// Se fija si el turno todavía no terminó
export function esTurnoFuturoOVigente(
  fechaISO: string,
  inicioHHMM: string,
  ahora: Date = new Date()
): boolean {
  const [hora] = inicioHHMM.split(':').map(Number);
  const finHHMM = `${String((hora || 0) + 1).padStart(2, '0')}:00`;
  const finTurno = construirFechaHoraLocal(fechaISO, finHHMM);
  return finTurno.getTime() > ahora.getTime();
}

// Hora límite para cancelar gratis (4 horas antes del turno)
export function calcularCancelableHasta(fechaISO: string, inicioHHMM: string): string {
  const inicioTurno = construirFechaHoraLocal(fechaISO, inicioHHMM);
  inicioTurno.setHours(inicioTurno.getHours() - HORAS_ANTICIPACION_CANCELACION);
  return formatearDateTimeConZona(inicioTurno);
}

// Evalúa si cancela a tiempo o si es cancelación tardía
export function evaluarVentanaCancelacion(
  cancelableHastaISO: string,
  ahora: Date = new Date()
): VentanaCancelacionInfo {
  const limite = new Date(cancelableHastaISO);
  const diffMs = limite.getTime() - ahora.getTime();
  const sinAviso = diffMs >= 0;
  const minutosRestantes = sinAviso ? Math.floor(diffMs / 60000) : 0;
  const hh = String(limite.getHours()).padStart(2, '0');
  const mm = String(limite.getMinutes()).padStart(2, '0');

  return {
    sinAviso,
    minutosRestantes,
    horaLimiteTexto: `${hh}:${mm} hs`,
  };
}

// Formato ISO con zona horaria (-03:00)
export function formatearDateTimeConZona(fecha: Date): string {
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const tzOffsetMin = -fecha.getTimezoneOffset();
  const signo = tzOffsetMin >= 0 ? '+' : '-';
  const horasTz = pad(tzOffsetMin / 60);
  const minTz = pad(tzOffsetMin % 60);

  return (
    `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
    `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}` +
    `${signo}${horasTz}:${minTz}`
  );
}

// Valida que sea una hora en punto entre 08:00 y 24:00
export function esHoraEnPuntoValida(horaHHMM: string, permitirVeinticuatro = false): boolean {
  const match = /^(\d{2}):00$/.exec(horaHHMM.trim());
  if (!match) return false;
  const hora = Number(match[1]);
  const max = permitirVeinticuatro ? HORA_CIERRE_GRILLA : HORA_CIERRE_GRILLA - 1;
  return hora >= HORA_APERTURA_GRILLA && hora <= max;
}

// Arma los 16 turnos del día cruzando bloqueos por lluvia, fijas y reservas
export function generarGrillaDiaria(
  espacioId: string,
  fechaISO: string,
  precioBase: number,
  reservasExistentes: Reserva[],
  reservasFijas: ReservaFija[],
  bloqueosMantenimiento: Array<Pick<BloqueoMantenimiento, 'inicio' | 'fin' | 'motivo'>>,
  ahora: Date = new Date()
): Turno[] {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const fechaObj = new Date(anio, mes - 1, dia, 0, 0, 0);
  const diaSemana = fechaObj.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const hoyISO = formatearFechaISOLocal(ahora);
  const esHoy = fechaISO === hoyISO;
  const esPasado = fechaISO < hoyISO;

  // Turnos de 1 hora desde 08:00 hasta 24:00 (16 franjas)
  const cantidadFranjas = HORA_CIERRE_GRILLA - HORA_APERTURA_GRILLA;
  const horas = Array.from({ length: cantidadFranjas }, (_, i) => i + HORA_APERTURA_GRILLA);

  return horas.map((hora) => {
    const inicioStr = `${String(hora).padStart(2, '0')}:00`;
    const finStr = `${String(hora + 1).padStart(2, '0')}:00`;
    const turnoId = construirTurnoId(espacioId, fechaISO, hora);

    let estado: EstadoTurno = 'libre';
    let reservaId: string | null = null;
    let motivoBloqueo: string | null = null;

    // 1. Prioridad máxima: Bloqueos por Mantenimiento o Lluvia
    const bloqueo = bloqueosMantenimiento.find(
      (b) => b.inicio <= inicioStr && b.fin > inicioStr
    );
    if (bloqueo) {
      estado = 'mantenimiento';
      motivoBloqueo = bloqueo.motivo;
    }

    // 2. Segunda prioridad: Reserva Fija Semanal activa y dentro de vigencia (desde..hasta)
    if (estado === 'libre') {
      const fija = reservasFijas.find((rf) => {
        if (!rf.activa || rf.espacioId !== espacioId || rf.dia !== diaSemana) {
          return false;
        }
        if (rf.desde > fechaISO) return false;
        if (rf.hasta !== null && rf.hasta < fechaISO) return false;
        return rf.inicio <= inicioStr && rf.fin > inicioStr;
      });

      if (fija) {
        estado = 'fijo';
        motivoBloqueo = `Fijo — ${fija.titular}`;
      }
    }

    // 3. Tercera prioridad: Reserva Esporádica activa (confirmada o cumplida)
    if (estado === 'libre') {
      const reserva = reservasExistentes.find(
        (r) =>
          r.espacioId === espacioId &&
          r.turnoId === turnoId &&
          (r.estado === 'confirmada' || r.estado === 'cumplida')
      );

      if (reserva) {
        estado = 'reservado';
        reservaId = reserva.id;
      }
    }

    // 4. Cuarta prioridad: Bloquear turnos cuya hora de inicio ya alcanzó o superó la hora actual
    if (estado === 'libre') {
      if (esPasado || (esHoy && hora <= ahora.getHours())) {
        estado = 'mantenimiento';
        motivoBloqueo = MOTIVO_TURNO_EXPIRADO;
      }
    }

    return {
      id: turnoId,
      espacioId,
      fecha: fechaISO,
      inicio: inicioStr,
      fin: finStr,
      estado,
      reservaId,
      motivoBloqueo,
      precio: precioBase,
    };
  });
}

// Resumen de los turnos del día para mostrar avisos en pantalla
export function resumirDisponibilidadDia(turnos: Turno[]): ResumenDisponibilidadDia {
  let libres = 0;
  let reservados = 0;
  let fijos = 0;
  let mantenimiento = 0;
  let expirados = 0;

  for (const turno of turnos) {
    if (turno.estado === 'libre') {
      libres += 1;
    } else if (turno.estado === 'reservado') {
      reservados += 1;
    } else if (turno.estado === 'fijo') {
      fijos += 1;
    } else if (turno.estado === 'mantenimiento') {
      if (turno.motivoBloqueo === MOTIVO_TURNO_EXPIRADO) {
        expirados += 1;
      } else {
        mantenimiento += 1;
      }
    }
  }

  const total = turnos.length;
  const sinTurnosLibres = total > 0 && libres === 0;
  const diaCompletoBloqueado = total > 0 && mantenimiento === total;
  const motivoDiaCompleto = diaCompletoBloqueado ? (turnos[0]?.motivoBloqueo ?? null) : null;

  return {
    total,
    libres,
    reservados,
    fijos,
    mantenimiento,
    expirados,
    sinTurnosLibres,
    diaCompletoBloqueado,
    motivoDiaCompleto,
  };
}
