import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function EncargadoLayout() {
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
        name="escaneo"
        options={{
          title: 'Escáner QR',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda del Día',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

