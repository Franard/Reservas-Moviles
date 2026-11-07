import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ReservasFijasAdminScreen() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Reservas Fijas Semanales y Precios</Text>
      <Text style={estilos.subtitulo}>
        Administración de turnos recurrentes de clubes/escuelas y actualización de tarifas por hora.
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

