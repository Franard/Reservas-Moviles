import { Platform } from 'react-native';
import Storage from 'expo-sqlite/kv-store';

export * from '@/db/sqlite';

const TEMA_KV_KEY = 'vgy_preferencia_tema';
const FAVORITOS_INVITADO_KV_KEY = 'vgy_favoritos_locales';
const ULTIMO_EMAIL_KV_KEY = 'vgy_ultimo_login_email';
const BIOMETRIA_HABILITADA_KV_KEY = 'vgy_biometria_habilitada';
const ULTIMA_SINCRONIZACION_KV_KEY = 'vgy_ultima_sincronizacion_ts';

export type PreferenciaTema = 'automatico' | 'claro' | 'oscuro';

export function obtenerPreferenciaTema(): PreferenciaTema {
  if (Platform.OS === 'web') return 'automatico';
  const valor = Storage.getItemSync(TEMA_KV_KEY) as PreferenciaTema | null;
  return valor ?? 'automatico';
}

export function guardarPreferenciaTema(preferencia: PreferenciaTema): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(TEMA_KV_KEY, preferencia);
}

export function obtenerFavoritosLocales(): string[] {
  if (Platform.OS === 'web') return [];
  const raw = Storage.getItemSync(FAVORITOS_INVITADO_KV_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function guardarFavoritosLocales(espaciosIds: string[]): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(FAVORITOS_INVITADO_KV_KEY, JSON.stringify(espaciosIds));
}

export function obtenerUltimoEmailLogin(): string {
  if (Platform.OS === 'web') return 'emiliano@mail.com';
  return Storage.getItemSync(ULTIMO_EMAIL_KV_KEY) ?? 'emiliano@mail.com';
}

export function guardarUltimoEmailLogin(email: string): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(ULTIMO_EMAIL_KV_KEY, email.trim().toLowerCase());
}

export function obtenerPreferenciaBiometria(): boolean {
  if (Platform.OS === 'web') return false;
  const valor = Storage.getItemSync(BIOMETRIA_HABILITADA_KV_KEY);
  return valor === 'true';
}

export function guardarPreferenciaBiometria(habilitada: boolean): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(BIOMETRIA_HABILITADA_KV_KEY, String(habilitada));
}

export function guardarTimestampUltimaSincronizacion(fechaISO: string = new Date().toISOString()): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(ULTIMA_SINCRONIZACION_KV_KEY, fechaISO);
}

export function obtenerTimestampUltimaSincronizacion(): string | null {
  if (Platform.OS === 'web') return null;
  return Storage.getItemSync(ULTIMA_SINCRONIZACION_KV_KEY);
}
