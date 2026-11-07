import React from 'react';
import { Pressable, Text } from 'react-native';
import { router, Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/hooks/useAuth';

export default function JugadorLayout() {
  const { usuario } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0B3A5D' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#0B3A5D',
        tabBarInactiveTintColor: '#78909C',
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{ marginRight: 14, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
              {usuario ? usuario.nombre.split(' ')[0] : 'Ingresar'}
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Espacios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas/index"
        options={{
          title: 'Mis Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="espacios/[id]"
        options={{
          href: null,
          title: 'Ficha del Espacio',
        }}
      />
      <Tabs.Screen
        name="disponibilidades/[espacioId]"
        options={{
          href: null,
          title: 'Disponibilidad',
        }}
      />
      <Tabs.Screen
        name="reservas/[id]"
        options={{
          href: null,
          title: 'Mi Reserva',
        }}
      />
    </Tabs>
  );
}

