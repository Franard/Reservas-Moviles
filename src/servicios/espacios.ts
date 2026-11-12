import { MOCK_DEPORTES, MOCK_ESPACIOS } from '@/mocks/datosMock';
import {
  guardarEspaciosCache,
  obtenerBaseDatosAsync,
  obtenerEspaciosCache,
} from '@/db/sqlite';
import type {
  Deporte,
  Espacio,
  FiltrosEspacio,
  RespuestaLista,
  RespuestaUno,
  Usuario,
} from '@/tipos';
import { ErrorServicioAPI, simularRedAsync } from './apiCliente';
import { obtenerUsuariosMemoria, sincronizarUsuarioEnKVSiActivo } from './auth';
import {
  guardarFavoritosLocales,
  guardarTimestampUltimaSincronizacion,
  obtenerFavoritosLocales,
} from './storageLocal';

// Copia mutable en memoria para soportar actualización de tarifas por el Administrador
const espaciosMemoria: Espacio[] = MOCK_ESPACIOS.map((e) => ({
  ...e,
  coordenadas: { ...e.coordenadas },
  imagenes: [...e.imagenes],
}));

function clonarEspacio(espacio: Espacio): Espacio {
  return {
    ...espacio,
    coordenadas: { ...espacio.coordenadas },
    imagenes: [...espacio.imagenes],
  };
}

export function obtenerEspaciosMemoria(): Espacio[] {
  return espaciosMemoria;
}

export function buscarEspacioMemoriaPorId(id: string): Espacio | undefined {
  if (!id) return undefined;
  const idLimpio = String(Array.isArray(id) ? id[0] : id).trim();
  return espaciosMemoria.find((e) => e.id === idLimpio);
}

// Guarda las canchas en SQLite para verlas sin internet
export async function sincronizarEspaciosEnSqlite(): Promise<void> {
  const db = await obtenerBaseDatosAsync();
  if (!db) return;
  try {
    const habilitados = espaciosMemoria.filter((e) => e.activo);
    await guardarEspaciosCache(db, habilitados);
    guardarTimestampUltimaSincronizacion();
  } catch (error) {
    console.warn('[Espacios] No se pudo guardar caché offline:', error);
  }
}

export async function listarDeportes(): Promise<RespuestaLista<Deporte>> {
  await simularRedAsync(150);
  return {
    datos: MOCK_DEPORTES.map((d) => ({ ...d })),
    meta: {
      total: MOCK_DEPORTES.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

export async function listarEspacios(filtros?: FiltrosEspacio): Promise<RespuestaLista<Espacio>> {
  let resultado: Espacio[] = [];

  try {
    await simularRedAsync(220);
    resultado = espaciosMemoria.filter((e) => e.activo);
    void sincronizarEspaciosEnSqlite();
  } catch (error) {
    // Si estamos offline, leer la caché SQLite local
    const db = await obtenerBaseDatosAsync();
    if (db) {
      const cacheados = await obtenerEspaciosCache(db);
      if (cacheados.length > 0) {
        resultado = cacheados.filter((e) => e.activo);
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (filtros?.deporteId) {
    resultado = resultado.filter((e) => e.deporteId === filtros.deporteId);
  }

  if (filtros?.complejo) {
    resultado = resultado.filter((e) => e.complejo === filtros.complejo);
  }

  if (filtros?.soloFavoritos) {
    const idsFavoritos = filtros.favoritosIds ?? obtenerFavoritosLocales();
    resultado = resultado.filter((e) => idsFavoritos.includes(e.id));
  }

  if (filtros?.busqueda && filtros.busqueda.trim().length > 0) {
    const q = filtros.busqueda.trim().toLowerCase();
    resultado = resultado.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.complejo.toLowerCase().includes(q) ||
        e.superficie.toLowerCase().includes(q)
    );
  }

  return {
    datos: resultado.map(clonarEspacio),
    meta: {
      total: resultado.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

export async function obtenerEspacioPorId(id: string): Promise<RespuestaUno<Espacio>> {
  await simularRedAsync(160);
  const espacio = buscarEspacioMemoriaPorId(id);

  if (!espacio) {
    throw new ErrorServicioAPI(
      'ESPACIO_NO_ENCONTRADO',
      'El espacio deportivo solicitado no existe.'
    );
  }

  return {
    datos: clonarEspacio(espacio),
    meta: null,
  };
}

export async function actualizarPrecioEspacio(
  espacioId: string,
  nuevoPrecioPorHora: number
): Promise<RespuestaUno<Espacio>> {
  await simularRedAsync(240);

  if (!Number.isFinite(nuevoPrecioPorHora) || nuevoPrecioPorHora <= 0) {
    throw new ErrorServicioAPI('PRECIO_INVALIDO', 'El precio por hora debe ser mayor a cero.');
  }

  const espacio = buscarEspacioMemoriaPorId(espacioId);
  if (!espacio) {
    throw new ErrorServicioAPI('ESPACIO_NO_ENCONTRADO', 'No se encontró el espacio deportivo.');
  }

  espacio.precioPorHora = Math.round(nuevoPrecioPorHora);
  return {
    datos: clonarEspacio(espacio),
    meta: null,
  };
}

export async function alternarEspacioFavorito(
  espacioId: string,
  usuarioId?: string | null
): Promise<
  RespuestaUno<{
    espaciosFavoritos: string[];
    esFavorito: boolean;
    usuarioActualizado: Usuario | null;
  }>
> {
  await simularRedAsync(160);

  const espacio = buscarEspacioMemoriaPorId(espacioId);
  if (!espacio) {
    throw new ErrorServicioAPI('ESPACIO_NO_ENCONTRADO', 'No se encontró el espacio deportivo.');
  }

  if (usuarioId) {
    const usuario = obtenerUsuariosMemoria().find((u) => u.id === usuarioId);
    if (!usuario) {
      throw new ErrorServicioAPI('USUARIO_NO_ENCONTRADO', 'No se encontró el perfil del usuario.');
    }

    const yaEstaba = usuario.espaciosFavoritos.includes(espacioId);
    usuario.espaciosFavoritos = yaEstaba
      ? usuario.espaciosFavoritos.filter((id) => id !== espacioId)
      : [...usuario.espaciosFavoritos, espacioId];

    sincronizarUsuarioEnKVSiActivo(usuario);

    return {
      datos: {
        espaciosFavoritos: [...usuario.espaciosFavoritos],
        esFavorito: !yaEstaba,
        usuarioActualizado: {
          ...usuario,
          espaciosFavoritos: [...usuario.espaciosFavoritos],
        },
      },
      meta: null,
    };
  }

  // Modo invitado: persiste favoritos locales en kv-store
  const actuales = obtenerFavoritosLocales();
  const yaEstaba = actuales.includes(espacioId);
  const actualizados = yaEstaba
    ? actuales.filter((id) => id !== espacioId)
    : [...actuales, espacioId];
  guardarFavoritosLocales(actualizados);

  return {
    datos: {
      espaciosFavoritos: actualizados,
      esFavorito: !yaEstaba,
      usuarioActualizado: null,
    },
    meta: null,
  };
}

export function listarComplejosDisponibles(): string[] {
  return Array.from(new Set(espaciosMemoria.map((e) => e.complejo)));
}
