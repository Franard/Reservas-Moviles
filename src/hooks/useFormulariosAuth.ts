import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { obtenerMensajeErrorAPI } from '@/servicios/apiCliente';
import type { Usuario } from '@/tipos';

export function useIngreso() {
  const { iniciarSesion } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const ejecutarIngreso = useCallback(
    async (email: string, password: string): Promise<Usuario | null> => {
      setEnviando(true);
      setErrorServidor(null);
      try {
        return await iniciarSesion(email, password);
      } catch (err) {
        setErrorServidor(obtenerMensajeErrorAPI(err, 'No se pudo iniciar sesión.'));
        return null;
      } finally {
        setEnviando(false);
      }
    },
    [iniciarSesion]
  );

  return { ejecutarIngreso, enviando, errorServidor };
}

export function useRegistroCuenta() {
  const { registrar } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const ejecutarRegistro = useCallback(
    async (datos: {
      nombre: string;
      email: string;
      telefono: string;
      password: string;
    }): Promise<Usuario | null> => {
      setEnviando(true);
      setErrorServidor(null);
      try {
        return await registrar(datos);
      } catch (err) {
        setErrorServidor(obtenerMensajeErrorAPI(err, 'No se pudo crear la cuenta.'));
        return null;
      } finally {
        setEnviando(false);
      }
    },
    [registrar]
  );

  return { ejecutarRegistro, enviando, errorServidor };
}

