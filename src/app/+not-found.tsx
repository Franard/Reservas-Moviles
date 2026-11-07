import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Esta sección no existe</Text>
      <Text style={estilos.descripcion}>
        La ruta solicitada no forma parte de Reservas Deportivas Villaguay.
      </Text>
      <Link href="/" style={estilos.enlace}>
        Volver al catálogo de espacios
      </Link>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0B3A5D',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 20,
  },
  enlace: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0288D1',
  },
});

