import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0B3A5D' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Ingresar' }} />
      <Stack.Screen name="registro" options={{ title: 'Crear Cuenta' }} />
    </Stack>
  );
}

