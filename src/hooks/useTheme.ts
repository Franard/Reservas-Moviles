import { useContext } from 'react';
import { ThemeContext, type ValorContextoTema } from '@/contextos/ThemeContext';

export function useTheme(): ValorContextoTema {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error('useTheme debe utilizarse dentro de un ThemeProvider');
  }
  return contexto;
}

