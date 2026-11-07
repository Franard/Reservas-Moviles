import axios from 'axios';
import { obtenerTokenSeguro } from '@/db/secureStore';
import type { ErrorAPI } from '@/tipos';

// URL base de la API
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.villaguay.gob.ar/v1';

let simularFalloRed = false;

export function configurarSimulacionErrorRed(activo: boolean): void {
  simularFalloRed = activo;
}

export function estaSimulandoErrorRed(): boolean {
  return simularFalloRed;
}

export class ErrorServicioAPI extends Error {
  public readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorServicioAPI';
    this.codigo = codigo;
  }

  public aFormatoAPI(): ErrorAPI {
    return {
      error: {
        codigo: this.codigo,
        mensaje: this.message,
      },
    };
  }
}

export function esErrorServicioAPI(error: unknown): error is ErrorServicioAPI {
  return error instanceof ErrorServicioAPI;
}

export function esCuerpoErrorAPI(valor: unknown): valor is ErrorAPI {
  if (typeof valor !== 'object' || valor === null || !('error' in valor)) {
    return false;
  }
  const cuerpo = valor.error;
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return false;
  }
  return (
    'codigo' in cuerpo &&
    'mensaje' in cuerpo &&
    typeof cuerpo.codigo === 'string' &&
    typeof cuerpo.mensaje === 'string'
  );
}

export function obtenerMensajeErrorAPI(
  error: unknown,
  mensajeAlternativo = 'No se pudo completar la operación.'
): string {
  if (esErrorServicioAPI(error)) return error.message;
  if (error instanceof Error && error.message.length > 0) return error.message;
  return mensajeAlternativo;
}

// Cliente Axios para peticiones HTTP
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use(async (config) => {
  const token = await obtenerTokenSeguro();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // POST /archivos es multipart: si forzamos JSON se pierde el boundary de FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  return config;
});

httpClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (esCuerpoErrorAPI(error.response?.data)) {
        const { codigo, mensaje } = error.response.data.error;
        return Promise.reject(new ErrorServicioAPI(codigo, mensaje));
      }

      if (!error.response) {
        return Promise.reject(
          new ErrorServicioAPI('SIN_CONEXION', 'Sin conexión. Verificá tu red e intentá de nuevo.')
        );
      }
    }

    return Promise.reject(
      new ErrorServicioAPI('ERROR_INESPERADO', 'No se pudo completar el pedido.')
    );
  }
);

// Simula delay de red en los mocks
export async function simularRedAsync(ms: number = 220): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  if (simularFalloRed) {
    throw new ErrorServicioAPI(
      'ERROR_RED',
      'No se pudo conectar con el servidor municipal. Verificá tu conexión a internet.'
    );
  }
}
