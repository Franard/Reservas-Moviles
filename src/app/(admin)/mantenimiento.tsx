import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MantenimientoAdminScreen() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Bloqueos por Lluvia y Mantenimiento</Text>
      <Text style={estilos.subtitulo}>
        Suspensión de franjas o jornadas completas con aviso automático a los jugadores afectados.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4F7FA',
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0B3A5D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
  },
});

