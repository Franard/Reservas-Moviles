import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Espacio, Reserva } from '@/tipos';

export const NOMBRE_BD_SQLITE = 'reservas_deportivas_villaguay.db';

let instanciaDbMemo: SQLiteDatabase | null = null;

// Abre la base SQLite fuera de componentes React
export async function obtenerBaseDatosAsync(): Promise<SQLiteDatabase | null> {
  if (Platform.OS === 'web') return null;
  if (instanciaDbMemo) return instanciaDbMemo;

  try {
    instanciaDbMemo = await SQLite.openDatabaseAsync(NOMBRE_BD_SQLITE);
    await inicializarBaseDatos(instanciaDbMemo);
    return instanciaDbMemo;
  } catch (error) {
    console.warn('[SQLite] No se pudo abrir la base de datos:', error);
    return null;
  }
}

// Tablas locales para que ande offline (reservas y canchas)
export async function inicializarBaseDatos(db: SQLiteDatabase): Promise<void> {
  if (Platform.OS === 'web') return;

  const VERSION_ESQUEMA = 1;
  const resultado = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = resultado?.user_version ?? 0;

  if (versionActual >= VERSION_ESQUEMA) {
    return;
  }

  if (versionActual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS reservas_offline (
        id TEXT PRIMARY KEY NOT NULL,
        turnoId TEXT NOT NULL,
        espacioId TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        cantidadPersonas INTEGER NOT NULL,
        codigoQr TEXT NOT NULL,
        estado TEXT NOT NULL,
        ingresoEn TEXT,
        creadaEn TEXT NOT NULL,
        cancelableHasta TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas_offline(usuarioId);
      CREATE INDEX IF NOT EXISTS idx_reservas_qr ON reservas_offline(codigoQr);

      CREATE TABLE IF NOT EXISTS espacios_cache (
        id TEXT PRIMARY KEY NOT NULL,
        jsonPayload TEXT NOT NULL,
        actualizadoEn TEXT NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
}

export async function guardarReservaOffline(db: SQLiteDatabase, r: Reserva): Promise<void> {
  if (Platform.OS === 'web') return;
  await db.runAsync(
    `INSERT OR REPLACE INTO reservas_offline
      (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id,
      r.turnoId,
      r.espacioId,
      r.usuarioId,
      r.cantidadPersonas,
      r.codigoQr,
      r.estado,
      r.ingresoEn,
      r.creadaEn,
      r.cancelableHasta,
    ]
  );
}

export async function guardarMultiplesReservasOffline(
  db: SQLiteDatabase,
  reservas: Reserva[]
): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const r of reservas) {
    await guardarReservaOffline(db, r);
  }
}

export async function obtenerReservasOffline(
  db: SQLiteDatabase,
  usuarioId?: string
): Promise<Reserva[]> {
  if (Platform.OS === 'web') return [];
  if (usuarioId) {
    return await db.getAllAsync<Reserva>(
      'SELECT * FROM reservas_offline WHERE usuarioId = ? ORDER BY creadaEn DESC',
      [usuarioId]
    );
  }
  return await db.getAllAsync<Reserva>('SELECT * FROM reservas_offline ORDER BY creadaEn DESC');
}

export async function obtenerReservaOfflinePorId(
  db: SQLiteDatabase,
  reservaId: string
): Promise<Reserva | null> {
  if (Platform.OS === 'web') return null;
  const fila = await db.getFirstAsync<Reserva>(
    'SELECT * FROM reservas_offline WHERE id = ?',
    [reservaId]
  );
  return fila ?? null;
}

export async function obtenerReservaOfflinePorQr(
  db: SQLiteDatabase,
  codigoQr: string
): Promise<Reserva | null> {
  if (Platform.OS === 'web') return null;
  const fila = await db.getFirstAsync<Reserva>(
    'SELECT * FROM reservas_offline WHERE codigoQr = ?',
    [codigoQr.trim()]
  );
  return fila ?? null;
}

export async function eliminarReservaOffline(
  db: SQLiteDatabase,
  reservaId: string
): Promise<void> {
  if (Platform.OS === 'web') return;
  await db.runAsync('DELETE FROM reservas_offline WHERE id = ?', [reservaId]);
}

export async function guardarEspaciosCache(
  db: SQLiteDatabase,
  espacios: Espacio[]
): Promise<void> {
  if (Platform.OS === 'web') return;
  const ahora = new Date().toISOString();
  for (const esp of espacios) {
    await db.runAsync(
      'INSERT OR REPLACE INTO espacios_cache (id, jsonPayload, actualizadoEn) VALUES (?, ?, ?)',
      [esp.id, JSON.stringify(esp), ahora]
    );
  }
}

export async function obtenerEspaciosCache(db: SQLiteDatabase): Promise<Espacio[]> {
  if (Platform.OS === 'web') return [];
  const filas = await db.getAllAsync<{ jsonPayload: string }>(
    'SELECT jsonPayload FROM espacios_cache ORDER BY id ASC'
  );
  return filas.map((f) => JSON.parse(f.jsonPayload) as Espacio);
}

export async function limpiarEspaciosCache(db: SQLiteDatabase): Promise<void> {
  if (Platform.OS === 'web') return;
  await db.runAsync('DELETE FROM espacios_cache');
}
