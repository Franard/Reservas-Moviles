import {
  BloqueoMantenimiento,
  Deporte,
  Espacio,
  Reserva,
  ReservaFija,
  Usuario,
} from '@/tipos';
import {
  calcularCancelableHasta,
  construirTurnoId,
  formatearDateTimeConZona,
  obtenerFechaConOffset,
  obtenerFechaDiaSemanaEnVentana,
} from '@/utils/calculoTurnos';

export const MOCK_DEPORTES: Deporte[] = [
  { id: 'dep-futbol5', nombre: 'Fútbol 5', icono: 'football-outline', color: '#2E7D32' },
  { id: 'dep-futbol11', nombre: 'Fútbol 11', icono: 'football', color: '#1B5E20' },
  { id: 'dep-basquet', nombre: 'Básquet', icono: 'basketball-outline', color: '#E65100' },
  { id: 'dep-voley', nombre: 'Vóley', icono: 'american-football-outline', color: '#0288D1' },
  { id: 'dep-tenis', nombre: 'Tenis', icono: 'tennisball-outline', color: '#F57F17' },
  { id: 'dep-multiuso', nombre: 'Multideporte', icono: 'trophy-outline', color: '#6A1B9A' },
];

// Canchas municipales
export const MOCK_ESPACIOS: Espacio[] = [
  {
    id: 'esp-01',
    nombre: 'Cancha 1 — Fútbol 5',
    deporteId: 'dep-futbol5',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped sintético',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 12000,
    coordenadas: { latitud: -31.8642, longitud: -59.0281 },
    imagenes: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    reglas: 'No se permite calzado con tapones metálicos ni de aluminio. Ingreso puntual con QR.',
    activo: true,
  },
  {
    id: 'esp-02',
    nombre: 'Cancha 2 — Fútbol 5',
    deporteId: 'dep-futbol5',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped sintético',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 12000,
    coordenadas: { latitud: -31.8645, longitud: -59.0285 },
    imagenes: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80',
    ],
    // Cancha sin video
    videoUrl: null,
    reglas: 'No se permite calzado con tapones de aluminio. Obligatorio presentar QR al encargado.',
    activo: true,
  },
  {
    id: 'esp-03',
    nombre: 'Cancha Principal — Fútbol 11',
    deporteId: 'dep-futbol11',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped natural',
    techado: false,
    iluminacion: true,
    capacidad: 22,
    precioPorHora: 24000,
    coordenadas: { latitud: -31.865, longitud: -59.0278 },
    imagenes: [
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    reglas: 'Sujeta a suspensión inmediata en caso de lluvia para preservar el césped natural.',
    activo: true,
  },
  {
    id: 'esp-04',
    nombre: 'Playón Básquet Norte',
    deporteId: 'dep-basquet',
    complejo: 'Polideportivo Municipal',
    superficie: 'cemento alisado',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 8000,
    coordenadas: { latitud: -31.8639, longitud: -59.0283 },
    imagenes: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl: null,
    reglas: 'Uso exclusivo con zapatillas de suela de goma limpia.',
    activo: true,
  },
  {
    id: 'esp-05',
    nombre: 'Playón Básquet Sur',
    deporteId: 'dep-basquet',
    complejo: 'Polideportivo Municipal',
    superficie: 'cemento alisado',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 8000,
    coordenadas: { latitud: -31.8641, longitud: -59.0287 },
    imagenes: [
      'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl: null,
    reglas: 'Prohibido colgarse de los aros.',
    activo: true,
  },
  {
    id: 'esp-06',
    nombre: 'Cancha Básquet Parquet',
    deporteId: 'dep-basquet',
    complejo: 'Gimnasio Cerrado Municipal',
    superficie: 'parquet flotante',
    techado: true,
    iluminacion: true,
    capacidad: 12,
    precioPorHora: 15000,
    coordenadas: { latitud: -31.8678, longitud: -59.0214 },
    imagenes: [
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    reglas: 'Ingreso únicamente con calzado deportivo limpio (no calle). Prohibido ingresar bebidas azucaradas.',
    activo: true,
  },
  {
    id: 'esp-07',
    nombre: 'Cancha Vóley 1',
    deporteId: 'dep-voley',
    complejo: 'Polideportivo Municipal',
    superficie: 'carpeta sintética',
    techado: false,
    iluminacion: true,
    capacidad: 12,
    precioPorHora: 8500,
    coordenadas: { latitud: -31.8644, longitud: -59.0276 },
    imagenes: [
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl: null,
    reglas: 'Solicitar red y antenas reglamentarias en portería al acreditar el QR.',
    activo: true,
  },
  {
    id: 'esp-08',
    nombre: 'Cancha Vóley 2 Techada',
    deporteId: 'dep-voley',
    complejo: 'Gimnasio Cerrado Municipal',
    superficie: 'parquet flotante',
    techado: true,
    iluminacion: true,
    capacidad: 14,
    precioPorHora: 13500,
    coordenadas: { latitud: -31.868, longitud: -59.0216 },
    imagenes: [
      'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    reglas: 'Suela blanca o non-marking obligatoria.',
    activo: true,
  },
  {
    id: 'esp-09',
    nombre: 'Court Tenis 1',
    deporteId: 'dep-tenis',
    complejo: 'Parque Berduc',
    superficie: 'polvo de ladrillo',
    techado: false,
    iluminacion: true,
    capacidad: 4,
    precioPorHora: 10000,
    coordenadas: { latitud: -31.8595, longitud: -59.0332 },
    imagenes: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    reglas: 'Obligatorio zapatillas lisas para polvo de ladrillo y pasar la rastra al finalizar.',
    activo: true,
  },
  {
    id: 'esp-10',
    nombre: 'Court Tenis 2',
    deporteId: 'dep-tenis',
    complejo: 'Parque Berduc',
    superficie: 'polvo de ladrillo',
    techado: false,
    iluminacion: false,
    capacidad: 4,
    precioPorHora: 8500,
    coordenadas: { latitud: -31.8598, longitud: -59.0335 },
    imagenes: [
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl: null,
    reglas: 'Sin iluminación artificial: uso recomendado en horario diurno. Pasar rastra al terminar.',
    activo: true,
  },
  {
    id: 'esp-11',
    nombre: 'Gimnasio Cerrado Principal',
    deporteId: 'dep-multiuso',
    complejo: 'Gimnasio Cerrado Municipal',
    superficie: 'parquet multiuso',
    techado: true,
    iluminacion: true,
    capacidad: 30,
    precioPorHora: 18000,
    coordenadas: { latitud: -31.8676, longitud: -59.0211 },
    imagenes: [
      'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackAds.mp4',
    reglas: 'Apto futsal, handball, básquet y eventos escolares. Respetar horario estricto de cierre.',
    activo: true,
  },
];

const FECHA_ANTEAYER = obtenerFechaConOffset(-2);
const FECHA_AYER = obtenerFechaConOffset(-1);
const FECHA_HOY = obtenerFechaConOffset(0);
const FECHA_MARTES_EN_VENTANA = obtenerFechaDiaSemanaEnVentana(2);

const FECHA_LLUVIA_COMPLETA =
  obtenerFechaConOffset(1) === FECHA_MARTES_EN_VENTANA
    ? obtenerFechaConOffset(3)
    : obtenerFechaConOffset(1);

const FECHA_GRILLA_LLENA = obtenerFechaConOffset(2);
const FECHA_DIA_4 = obtenerFechaConOffset(4);

export const FECHAS_ESCENARIOS_MOCK = {
  hoy: FECHA_HOY,
  martesReservaFija: FECHA_MARTES_EN_VENTANA,
  diaLluviaCompletaEsp02: FECHA_LLUVIA_COMPLETA,
  diaGrillaLlenaEsp01: FECHA_GRILLA_LLENA,
} as const;

export const MOCK_RESERVAS_FIJAS: ReservaFija[] = [
  {
    // Fija semanal (martes de 21 a 22)
    id: 'fij-07',
    espacioId: 'esp-02',
    titular: 'Grupo de los martes',
    dia: 2, // Martes
    inicio: '21:00',
    fin: '22:00',
    desde: '2026-03-01',
    hasta: null,
    activa: true,
  },
  {
    id: 'fij-01',
    espacioId: 'esp-01',
    titular: 'Club Barrio Norte',
    dia: 2, // Martes
    inicio: '20:00',
    fin: '22:00',
    desde: '2026-03-01',
    hasta: null,
    activa: true,
  },
  {
    id: 'fij-02',
    espacioId: 'esp-06',
    titular: 'Escuela Municipal de Básquet',
    dia: 4, // Jueves
    inicio: '18:00',
    fin: '20:00',
    desde: '2026-03-01',
    hasta: null,
    activa: true,
  },
  {
    id: 'fij-03',
    espacioId: 'esp-11',
    titular: 'CEF N° 7 Villaguay',
    dia: 1, // Lunes
    inicio: '14:00',
    fin: '17:00',
    desde: '2026-03-01',
    hasta: '2027-12-20',
    activa: true,
  },
  {
    // Fija vencida
    id: 'fij-04',
    espacioId: 'esp-02',
    titular: 'Torneo Invernal Sub-17',
    dia: 2, // Martes
    inicio: '18:00',
    fin: '20:00',
    desde: '2026-04-01',
    hasta: '2026-06-30',
    activa: true,
  },
  {
    // Fija pausada
    id: 'fij-05',
    espacioId: 'esp-08',
    titular: 'Liga Costera de Vóley',
    dia: 5, // Viernes
    inicio: '20:00',
    fin: '22:00',
    desde: '2026-03-01',
    hasta: null,
    activa: false,
  },
];

export const MOCK_BLOQUEOS_MANTENIMIENTO: BloqueoMantenimiento[] = [
  {
    // Bloqueo por lluvia
    id: 'blq-lluvia-01',
    espacioId: 'esp-02',
    fecha: FECHA_LLUVIA_COMPLETA,
    inicio: '08:00',
    fin: '24:00',
    motivo: 'Cancha anegada por lluvia intensa — Impracticable',
    porLluvia: true,
  },
  {
    // Bloqueo por mantenimiento
    id: 'blq-mant-02',
    espacioId: 'esp-09',
    fecha: FECHA_HOY,
    inicio: '14:00',
    fin: '16:00',
    motivo: 'Perfilado de polvo de ladrillo y tensado de red',
    porLluvia: false,
  },
  {
    // Bloqueo por lluvia
    id: 'blq-lluvia-03',
    espacioId: 'esp-03',
    fecha: FECHA_LLUVIA_COMPLETA,
    inicio: '08:00',
    fin: '18:00',
    motivo: 'Preservación del césped natural tras chaparrón matutino',
    porLluvia: true,
  },
];

// Grilla llena
const RESERVAS_GRILLA_LLENA: Reserva[] = Array.from({ length: 16 }, (_, idx) => {
  const hora = idx + 8;
  const hh = String(hora).padStart(2, '0');
  const turnoId = construirTurnoId('esp-01', FECHA_GRILLA_LLENA, hora);
  return {
    id: `res-full-${hh}`,
    turnoId,
    espacioId: 'esp-01',
    usuarioId: 'usr-305',
    cantidadPersonas: 10,
    codigoQr: `VGY-FULL-ESP01-${FECHA_GRILLA_LLENA.replace(/-/g, '')}-${hh}`,
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date()),
    cancelableHasta: calcularCancelableHasta(FECHA_GRILLA_LLENA, `${hh}:00`),
  };
});

export const MOCK_RESERVAS: Reserva[] = [
  // Reserva de Emiliano
  {
    id: 'res-1180',
    turnoId: construirTurnoId('esp-02', FECHA_DIA_4, 19),
    espacioId: 'esp-02',
    usuarioId: 'usr-207',
    cantidadPersonas: 10,
    codigoQr: `VGY-1180-ESP02-${FECHA_DIA_4.replace(/-/g, '')}-19`,
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date()),
    cancelableHasta: calcularCancelableHasta(FECHA_DIA_4, '19:00'),
  },
  // Turno de hoy a la noche
  {
    id: 'res-1181',
    turnoId: construirTurnoId('esp-01', FECHA_HOY, 22),
    espacioId: 'esp-01',
    usuarioId: 'usr-207',
    cantidadPersonas: 10,
    codigoQr: `VGY-1181-ESP01-${FECHA_HOY.replace(/-/g, '')}-22`,
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date()),
    cancelableHasta: calcularCancelableHasta(FECHA_HOY, '22:00'),
  },
  // Reserva de Lucía
  {
    id: 'res-1182',
    turnoId: construirTurnoId('esp-06', FECHA_HOY, 23),
    espacioId: 'esp-06',
    usuarioId: 'usr-305',
    cantidadPersonas: 10,
    codigoQr: `VGY-1182-ESP06-${FECHA_HOY.replace(/-/g, '')}-23`,
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date()),
    cancelableHasta: calcularCancelableHasta(FECHA_HOY, '23:00'),
  },
  // Turno ya ingresado
  {
    id: 'res-1183',
    turnoId: construirTurnoId('esp-09', FECHA_HOY, 10),
    espacioId: 'esp-09',
    usuarioId: 'usr-305',
    cantidadPersonas: 2,
    codigoQr: `VGY-1183-ESP09-${FECHA_HOY.replace(/-/g, '')}-10`,
    estado: 'cumplida',
    ingresoEn: `${FECHA_HOY}T09:55:00-03:00`,
    creadaEn: formatearDateTimeConZona(new Date(Date.now() - 86400000)),
    cancelableHasta: calcularCancelableHasta(FECHA_HOY, '10:00'),
  },
  // Reserva cancelada
  {
    id: 'res-1150',
    turnoId: construirTurnoId('esp-09', FECHA_HOY, 18),
    espacioId: 'esp-09',
    usuarioId: 'usr-207',
    cantidadPersonas: 2,
    codigoQr: `VGY-1150-ESP09-${FECHA_HOY.replace(/-/g, '')}-18`,
    estado: 'cancelada',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date(Date.now() - 86400000 * 2)),
    cancelableHasta: calcularCancelableHasta(FECHA_HOY, '18:00'),
  },
  // Turno cumplido
  {
    id: 'res-1090',
    turnoId: construirTurnoId('esp-02', FECHA_AYER, 20),
    espacioId: 'esp-02',
    usuarioId: 'usr-207',
    cantidadPersonas: 10,
    codigoQr: `VGY-1090-ESP02-${FECHA_AYER.replace(/-/g, '')}-20`,
    estado: 'cumplida',
    ingresoEn: `${FECHA_AYER}T19:54:00-03:00`,
    creadaEn: formatearDateTimeConZona(new Date(Date.now() - 86400000 * 4)),
    cancelableHasta: calcularCancelableHasta(FECHA_AYER, '20:00'),
  },
  // Ausente
  {
    id: 'res-1085',
    turnoId: construirTurnoId('esp-04', FECHA_ANTEAYER, 19),
    espacioId: 'esp-04',
    usuarioId: 'usr-207',
    cantidadPersonas: 8,
    codigoQr: `VGY-1085-ESP04-${FECHA_ANTEAYER.replace(/-/g, '')}-19`,
    estado: 'ausente',
    ingresoEn: null,
    creadaEn: formatearDateTimeConZona(new Date(Date.now() - 86400000 * 5)),
    cancelableHasta: calcularCancelableHasta(FECHA_ANTEAYER, '19:00'),
  },
  ...RESERVAS_GRILLA_LLENA,
];

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'usr-207',
    nombre: 'Emiliano Ruiz',
    email: 'emiliano@mail.com',
    telefono: '3455-401122',
    rol: 'jugador',
    espaciosFavoritos: ['esp-02', 'esp-09'],
    cancelacionesTardias: 1,
    ausencias: 1,
  },
  {
    id: 'usr-001',
    nombre: 'Marcelo Encargado',
    email: 'marcelo@villaguay.gob.ar',
    telefono: '3455-409988',
    rol: 'encargado',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
  },
  {
    id: 'usr-000',
    nombre: 'Nahuel Ojeda',
    email: 'deportes@villaguay.gob.ar',
    telefono: '3455-421000',
    rol: 'administrador',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
  },
  {
    id: 'usr-305',
    nombre: 'Lucía Pereyra',
    email: 'lucia@mail.com',
    telefono: '3455-456789',
    rol: 'jugador',
    espaciosFavoritos: ['esp-06', 'esp-08'],
    cancelacionesTardias: 0,
    ausencias: 0,
  },
];

// Credenciales demo 
export const CREDENCIALES_MOCK: Record<string, { password: string; usuarioId: string }> = {
  'emiliano@mail.com': { password: '123456', usuarioId: 'usr-207' },
  'jugador@villaguay.gob.ar': { password: '123456', usuarioId: 'usr-207' },
  'lucia@mail.com': { password: '123456', usuarioId: 'usr-305' },
  'marcelo@villaguay.gob.ar': { password: '123456', usuarioId: 'usr-001' },
  'deportes@villaguay.gob.ar': { password: '123456', usuarioId: 'usr-000' },
};
