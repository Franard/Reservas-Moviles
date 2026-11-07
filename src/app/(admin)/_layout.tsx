import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0B3A5D' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#0B3A5D',
      }}
    >
      <Tabs.Screen
        name="mantenimiento"
        options={{
          title: 'Mantenimiento / Lluvia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="rainy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas-fijas"
        options={{
          title: 'Reservas Fijas y Tarifas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

