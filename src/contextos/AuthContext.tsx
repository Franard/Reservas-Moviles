import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  autenticarConBiometria,
  cerrarSesion as cerrarSesionServicio,
  iniciarSesion as iniciarSesionServicio,
  obtenerToken,
  obtenerUsuarioLocal,
  registrarUsuario as registrarUsuarioServicio,
  sincronizarUsuarioEnKVSiActivo,
  verificarDisponibilidadBiometria,
} from '@/servicios/auth';
import {
  guardarPreferenciaBiometria,
  guardarUltimoEmailLogin,
  obtenerPreferenciaBiometria,
  obtenerUltimoEmailLogin,
} from '@/servicios/storageLocal';
import { Rol, Usuario } from '@/tipos';

interface ContextoAuthValor {
  usuario: Usuario | null;
  cargandoSesion: boolean;
  estaAutenticado: boolean;
  ultimoEmail: string;
  biometriaHabilitada: boolean;
  hardwareBiometricoDisponible: boolean;
  iniciarSesion: (email: string, password: string) => Promise<Usuario>;
  registrar: (datos: {
    nombre: string;
    email: string;
    telefono: string;
    password: string;
  }) => Promise<Usuario>;
  actualizarUsuarioSesion: (usuarioActualizado: Usuario) => void;
  validarBiometria: (mensaje?: string) => Promise<boolean>;
  iniciarSesionConBiometria: () => Promise<boolean>;
  alternarBiometriaHabilitada: (habilitar: boolean) => void;
  cambiarRolTemporal: (nuevoRol: Rol) => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<ContextoAuthValor | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState<boolean>(true);
  const [ultimoEmail, setUltimoEmail] = useState<string>(() => obtenerUltimoEmailLogin());
  const [biometriaHabilitada, setBiometriaHabilitada] = useState<boolean>(() =>
    obtenerPreferenciaBiometria()
  );
  const [hardwareBiometricoDisponible, setHardwareBiometricoDisponible] = useState<boolean>(false);

  useEffect(() => {
    let montado = true;

    async function hidratarSesion() {
      try {
        const token = await obtenerToken();
        const perfilLocal = obtenerUsuarioLocal();
        const bioEstado = await verificarDisponibilidadBiometria();

        if (montado) {
          setHardwareBiometricoDisponible(bioEstado.disponible);
          if (token && perfilLocal) {
            setUsuario(perfilLocal);
          }
        }
      } finally {
        if (montado) {
          setCargandoSesion(false);
        }
      }
    }

    hidratarSesion();
    return () => {
      montado = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const respuesta = await iniciarSesionServicio(email, password);
    const u = respuesta.datos.usuario;
    setUsuario(u);
    setUltimoEmail(u.email);
    guardarUltimoEmailLogin(u.email);
    return u;
  }, []);

  const registrar = useCallback(
    async (datos: { nombre: string; email: string; telefono: string; password: string }) => {
      const respuesta = await registrarUsuarioServicio(datos);
      const u = respuesta.datos.usuario;
      setUsuario(u);
      setUltimoEmail(u.email);
      guardarUltimoEmailLogin(u.email);
      return u;
    },
    []
  );

  const actualizarUsuarioSesion = useCallback((usuarioActualizado: Usuario) => {
    setUsuario({
      ...usuarioActualizado,
      espaciosFavoritos: [...usuarioActualizado.espaciosFavoritos],
    });
    sincronizarUsuarioEnKVSiActivo(usuarioActualizado);
  }, []);

  const validarBiometria = useCallback(async (mensaje?: string) => {
    return await autenticarConBiometria(mensaje);
  }, []);

  const alternarBiometriaHabilitada = useCallback((habilitar: boolean) => {
    setBiometriaHabilitada(habilitar);
    guardarPreferenciaBiometria(habilitar);
  }, []);

  const iniciarSesionConBiometria = useCallback(async (): Promise<boolean> => {
    const perfilGuardado = obtenerUsuarioLocal();
    if (!perfilGuardado) {
      return false;
    }
    const exito = await autenticarConBiometria('Ingreso rápido — Dirección de Deportes Villaguay');
    if (exito) {
      setUsuario(perfilGuardado);
      return true;
    }
    return false;
  }, []);

  const cambiarRolTemporal = useCallback((nuevoRol: Rol) => {
    setUsuario((actual) => {
      if (!actual) return null;
      const modificado: Usuario = { ...actual, rol: nuevoRol };
      sincronizarUsuarioEnKVSiActivo(modificado);
      return modificado;
    });
  }, []);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionServicio();
    setUsuario(null);
  }, []);

  const valor = useMemo<ContextoAuthValor>(
    () => ({
      usuario,
      cargandoSesion,
      estaAutenticado: usuario !== null,
      ultimoEmail,
      biometriaHabilitada,
      hardwareBiometricoDisponible,
      iniciarSesion,
      registrar,
      actualizarUsuarioSesion,
      validarBiometria,
      iniciarSesionConBiometria,
      alternarBiometriaHabilitada,
      cambiarRolTemporal,
      cerrarSesion,
    }),
    [
      usuario,
      cargandoSesion,
      ultimoEmail,
      biometriaHabilitada,
      hardwareBiometricoDisponible,
      iniciarSesion,
      registrar,
      actualizarUsuarioSesion,
      validarBiometria,
      iniciarSesionConBiometria,
      alternarBiometriaHabilitada,
      cambiarRolTemporal,
      cerrarSesion,
    ]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): ContextoAuthValor {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuthContext debe utilizarse dentro de un AuthProvider');
  }
  return contexto;
}
