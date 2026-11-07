import type {
  Coordenadas,
  EstadoReserva,
  Reserva,
  Turno,
  Usuario,
} from './entidades';

export interface MetaPaginacion {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaLista<T> {
  datos: T[];
  meta: MetaPaginacion;
}

export interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

export interface RespuestaAPI<T> {
  datos: T;
  meta: MetaPaginacion | null;
}

export interface ErrorAPI {
  error: {
    codigo: string;
    mensaje: string;
  };
}

export interface SesionUsuario {
  token: string;
  refreshToken?: string | null;
  usuario: Usuario;
}

export interface BloqueoMantenimiento {
  id: string;
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
  motivo: string;
  porLluvia: boolean;
}

export interface FiltrosEspacio {
  deporteId?: string | null;
  complejo?: string | null;
  soloFavoritos?: boolean;
  favoritosIds?: string[];
  busqueda?: string;
}

export interface DatosTurnoExtraidos {
  espacioId: string;
  fechaISO: string;
  horaInicio: number;
  inicioHHMM: string;
  finHHMM: string;
}

export interface DiaCalendarioGrilla {
  fechaISO: string;
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  esHoy: boolean;
  esManiana: boolean;
  numeroDia: string;
  nombreDiaCorto: string;
  nombreDiaLargo: string;
  mesCorto: string;
  etiquetaCorta: string;
  etiquetaLarga: string;
}

export interface ResumenDisponibilidadDia {
  total: number;
  libres: number;
  reservados: number;
  fijos: number;
  mantenimiento: number;
  expirados: number;
  sinTurnosLibres: boolean;
  diaCompletoBloqueado: boolean;
  motivoDiaCompleto: string | null;
}

export interface VentanaCancelacionInfo {
  sinAviso: boolean;
  minutosRestantes: number;
  horaLimiteTexto: string;
}

export interface ReservaDetallada extends Reserva {
  espacioNombre: string;
  complejo: string;
  deporteId: string;
  superficie: string;
  coordenadas: Coordenadas;
  fechaISO: string;
  inicio: string;
  fin: string;
  precioPorHora: number;
  esFuturaOVigente: boolean;
}

export interface ResumenMisReservas {
  proximas: ReservaDetallada[];
  pasadas: ReservaDetallada[];
  todas: ReservaDetallada[];
  activasCount: number;
  maxActivasPermitidas: number;
}

export interface FiltrosAgendaEncargado {
  complejo?: string | null;
  espacioId?: string | null;
  soloReservas?: boolean;
}

export interface ItemAgendaEncargado {
  turno: Turno;
  espacioNombre: string;
  complejo: string;
  deporteId: string;
  reserva: Reserva | null;
  estadoReserva: EstadoReserva | null;
  jugadorNombre: string | null;
  jugadorTelefono: string | null;
  jugadorAusencias: number | null;
  titularFijo: string | null;
  porLluvia: boolean;
}

export interface ResultadoValidacionQr {
  reserva: Reserva;
  espacioNombre: string;
  complejo: string;
  jugadorNombre: string;
  fechaISO: string;
  inicio: string;
  fin: string;
}

export interface ParametrosCrearBloqueo {
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
  motivo: string;
  porLluvia: boolean;
}

export interface ResultadoBloqueoMantenimiento {
  bloqueo: BloqueoMantenimiento;
  reservasAfectadas: Reserva[];
}

export interface ParametrosCrearReservaFija {
  espacioId: string;
  titular: string;
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  inicio: string;
  fin: string;
  desde: string;
  hasta: string | null;
}
