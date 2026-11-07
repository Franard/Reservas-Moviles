import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Storage from 'expo-sqlite/kv-store';
import {
  eliminarTokenSeguro,
  guardarTokenSeguro,
  obtenerTokenSeguro,
} from '@/db/secureStore';
import { CREDENCIALES_MOCK, MOCK_USUARIOS } from '@/mocks/datosMock';
import type { RespuestaUno, SesionUsuario, Usuario } from '@/tipos';
import { ErrorServicioAPI, simularRedAsync } from './apiCliente';

const USUARIO_KV_KEY = 'vgy_user_session_profile';

// Copia mutable en memoria para reflejar altas y cambios de favoritos/contadores en modo mock
const usuariosMemoria: Usuario[] = MOCK_USUARIOS.map((u) => ({
  ...u,
  espaciosFavoritos: [...u.espaciosFavoritos],
}));

export function guardarPerfilEnKV(usuario: Usuario): void {
  if (Platform.OS === 'web') return;
  Storage.setItemSync(USUARIO_KV_KEY, JSON.stringify(usuario));
}

export function obtenerUsuarioLocal(): Usuario | null {
  if (Platform.OS === 'web') return null;
  const raw = Storage.getItemSync(USUARIO_KV_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

// Actualiza los datos del usuario local si es el que está logueado
export function sincronizarUsuarioEnKVSiActivo(usuarioActualizado: Usuario): void {
  const actual = obtenerUsuarioLocal();
  if (actual && actual.id === usuarioActualizado.id) {
    guardarPerfilEnKV({
      ...usuarioActualizado,
      espaciosFavoritos: [...usuarioActualizado.espaciosFavoritos],
    });
  }
}

export async function guardarSesion(token: string, usuario: Usuario): Promise<void> {
  await guardarTokenSeguro(token);
  guardarPerfilEnKV(usuario);
}

export async function obtenerToken(): Promise<string | null> {
  return await obtenerTokenSeguro();
}

export async function iniciarSesion(
  email: string,
  password: string
): Promise<RespuestaUno<SesionUsuario>> {
  await simularRedAsync(280);

  const emailNormalizado = email.trim().toLowerCase();
  const credencial = CREDENCIALES_MOCK[emailNormalizado];

  if (!credencial || credencial.password !== password) {
    throw new ErrorServicioAPI(
      'CREDENCIALES_INVALIDAS',
      'El correo electrónico o la contraseña no son correctos.'
    );
  }

  const usuario = usuariosMemoria.find((u) => u.id === credencial.usuarioId);
  if (!usuario) {
    throw new ErrorServicioAPI('USUARIO_NO_ENCONTRADO', 'No se encontró el perfil del usuario.');
  }

  const copiaUsuario: Usuario = {
    ...usuario,
    espaciosFavoritos: [...usuario.espaciosFavoritos],
  };

  const token = `jwt-vgy-${copiaUsuario.id}-${Date.now()}`;
  await guardarSesion(token, copiaUsuario);

  return {
    datos: {
      token,
      refreshToken: `refresh-vgy-${copiaUsuario.id}-${Date.now()}`,
      usuario: copiaUsuario,
    },
    meta: null,
  };
}

export async function registrarUsuario(datos: {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}): Promise<RespuestaUno<SesionUsuario>> {
  await simularRedAsync(320);

  const emailNorm = datos.email.trim().toLowerCase();
  if (CREDENCIALES_MOCK[emailNorm]) {
    throw new ErrorServicioAPI('EMAIL_REGISTRADO', 'Ya existe una cuenta con ese correo.');
  }

  const nuevoUsuario: Usuario = {
    id: `usr-${Date.now().toString().slice(-4)}`,
    nombre: datos.nombre.trim(),
    email: emailNorm,
    telefono: datos.telefono.trim(),
    rol: 'jugador',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
  };

  usuariosMemoria.push(nuevoUsuario);
  CREDENCIALES_MOCK[emailNorm] = {
    password: datos.password,
    usuarioId: nuevoUsuario.id,
  };

  const copiaUsuario: Usuario = {
    ...nuevoUsuario,
    espaciosFavoritos: [...nuevoUsuario.espaciosFavoritos],
  };

  const token = `jwt-vgy-${copiaUsuario.id}-${Date.now()}`;
  await guardarSesion(token, copiaUsuario);

  return {
    datos: {
      token,
      refreshToken: `refresh-vgy-${copiaUsuario.id}-${Date.now()}`,
      usuario: copiaUsuario,
    },
    meta: null,
  };
}

export async function obtenerPerfilActual(): Promise<RespuestaUno<Usuario>> {
  await simularRedAsync(140);
  const local = obtenerUsuarioLocal();
  if (!local) {
    throw new ErrorServicioAPI('NO_AUTENTICADO', 'No hay una sesión activa en este dispositivo.');
  }
  const enMemoria = usuariosMemoria.find((u) => u.id === local.id) ?? local;
  return {
    datos: {
      ...enMemoria,
      espaciosFavoritos: [...enMemoria.espaciosFavoritos],
    },
    meta: null,
  };
}

export async function verificarDisponibilidadBiometria(): Promise<{
  disponible: boolean;
  motivo: string | null;
}> {
  if (Platform.OS === 'web') {
    return { disponible: false, motivo: 'Biometría no disponible en navegador web.' };
  }
  const tieneHardware = await LocalAuthentication.hasHardwareAsync();
  if (!tieneHardware) {
    return { disponible: false, motivo: 'Este dispositivo no cuenta con lector biométrico.' };
  }
  const tieneRegistros = await LocalAuthentication.isEnrolledAsync();
  if (!tieneRegistros) {
    return { disponible: false, motivo: 'No hay huellas o rostros configurados en el teléfono.' };
  }
  return { disponible: true, motivo: null };
}

export async function autenticarConBiometria(
  mensajePrompt = 'Reingreso — Verificá tu identidad'
): Promise<boolean> {
  const estado = await verificarDisponibilidadBiometria();
  if (!estado.disponible) {
    return false;
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensajePrompt,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar contraseña',
  });

  return resultado.success;
}

export async function cerrarSesion(): Promise<void> {
  await eliminarTokenSeguro();
  if (Platform.OS !== 'web') {
    Storage.removeItemSync(USUARIO_KV_KEY);
  }
}

export function obtenerUsuariosMemoria(): Usuario[] {
  return usuariosMemoria;
}
