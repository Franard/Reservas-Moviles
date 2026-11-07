import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EscaneoQrScreen() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Control de Ingreso en Puerta</Text>
      <Text style={estilos.subtitulo}>
        Escaneo QR con expo-camera, reingreso biométrico y validación háptica.
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
  },
  subtitulo: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
  },
});

