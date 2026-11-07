import React, { useState } from 'react';
import { Platform, LogBox } from 'react-native';

LogBox.ignoreLogs([
  '[expo-notifications]',
  'Cannot find native module',
]);
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BannerConectividad } from '@/componentes/comun/BannerConectividad';
import { AuthProvider } from '@/contextos/AuthContext';
import { ThemeProvider } from '@/contextos/ThemeContext';
import { inicializarBaseDatos, NOMBRE_BD_SQLITE } from '@/db/sqlite';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

function ContenedorPersistencia({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  return (
    <SQLiteProvider databaseName={NOMBRE_BD_SQLITE} onInit={inicializarBaseDatos}>
      {children}
    </SQLiteProvider>
  );
}

function NavegadorRaiz() {
  const { usuario } = useAuth();
  const { esquema, paleta } = useTheme();

  const esEncargadoOAdmin =
    usuario?.rol === 'encargado' || usuario?.rol === 'administrador';
  const esAdministrador = usuario?.rol === 'administrador';

  return (
    <>
      <StatusBar style={esquema === 'dark' ? 'light' : 'light'} />
      <BannerConectividad />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B3A5D' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: paleta.fondo },
        }}
      >
        {/* Rutas de jugador y login */}
        <Stack.Screen name="(jugador)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Rutas protegidas por rol */}
        <Stack.Protected guard={esEncargadoOAdmin}>
          <Stack.Screen name="(encargado)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={esAdministrador}>
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Screen name="+not-found" options={{ title: 'Pantalla no encontrada' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            gcTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ContenedorPersistencia>
          <ThemeProvider>
            <AuthProvider>
              <NavegadorRaiz />
            </AuthProvider>
          </ThemeProvider>
        </ContenedorPersistencia>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
