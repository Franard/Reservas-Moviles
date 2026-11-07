import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export enum ClavesSeguras {
  JWT_TOKEN = 'vgy_auth_jwt_token',
  REFRESH_TOKEN = 'vgy_auth_refresh_token',
}

// Guarda el JWT cifrado en el dispositivo
export async function guardarTokenSeguro(token: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(ClavesSeguras.JWT_TOKEN, token);
}

export async function obtenerTokenSeguro(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return await SecureStore.getItemAsync(ClavesSeguras.JWT_TOKEN);
}

export async function guardarRefreshTokenSeguro(refreshToken: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(ClavesSeguras.REFRESH_TOKEN, refreshToken);
}

export async function obtenerRefreshTokenSeguro(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return await SecureStore.getItemAsync(ClavesSeguras.REFRESH_TOKEN);
}

export async function eliminarTokenSeguro(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(ClavesSeguras.JWT_TOKEN);
  await SecureStore.deleteItemAsync(ClavesSeguras.REFRESH_TOKEN);
}
