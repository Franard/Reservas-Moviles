import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  guardarPreferenciaTema,
  obtenerPreferenciaTema,
  type PreferenciaTema,
} from '@/servicios/storageLocal';

export type EsquemaColor = 'light' | 'dark';

export interface PaletaTema {
  fondo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  primario: string;
  sobrePrimario: string;
  acento: string;
  exito: string;
  peligro: string;
  borde: string;
}

export const PALETA_CLARA: PaletaTema = {
  fondo: '#F4F7FA',
  superficie: '#FFFFFF',
  texto: '#102027',
  textoSecundario: '#546E7A',
  primario: '#0B3A5D',
  sobrePrimario: '#FFFFFF',
  acento: '#0288D1',
  exito: '#2E7D32',
  peligro: '#B71C1C',
  borde: '#DCE4EC',
};

// Tema oscuro
export const PALETA_OSCURA: PaletaTema = {
  fondo: '#0F172A',
  superficie: '#1E293B',
  texto: '#F8FAFC',
  textoSecundario: '#94A3B8',
  primario: '#38BDF8',
  sobrePrimario: '#0F172A',
  acento: '#38BDF8',
  exito: '#4ADE80',
  peligro: '#F87171',
  borde: '#334155',
};

export const PALETAS: Record<EsquemaColor, PaletaTema> = {
  light: PALETA_CLARA,
  dark: PALETA_OSCURA,
};

export interface ValorContextoTema {
  esquema: EsquemaColor;
  preferencia: PreferenciaTema;
  cambiarPreferencia: (nueva: PreferenciaTema) => void;
  paleta: PaletaTema;
}

export const ThemeContext = createContext<ValorContextoTema | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(() => obtenerPreferenciaTema());

  const cambiarPreferencia = useCallback((nueva: PreferenciaTema) => {
    setPreferencia(nueva);
    guardarPreferenciaTema(nueva);
  }, []);

  const esquemaResuelto: EsquemaColor =
    preferencia === 'oscuro'
      ? 'dark'
      : preferencia === 'claro'
        ? 'light'
        : esquemaSistema === 'dark'
          ? 'dark'
          : 'light';

  const valor = useMemo<ValorContextoTema>(
    () => ({
      esquema: esquemaResuelto,
      preferencia,
      cambiarPreferencia,
      paleta: PALETAS[esquemaResuelto],
    }),
    [esquemaResuelto, preferencia, cambiarPreferencia]
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

