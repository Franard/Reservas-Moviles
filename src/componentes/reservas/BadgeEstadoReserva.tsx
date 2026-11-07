import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EstadoReserva } from '@/tipos';

const CONFIG_ESTADOS: Record<
  EstadoReserva,
  { fondo: string; texto: string; etiqueta: string }
> = {
  confirmada: {
    fondo: '#E8F5E9',
    texto: '#2E7D32',
    etiqueta: 'Confirmada',
  },
  cancelada: {
    fondo: '#FFEBEE',
    texto: '#C62828',
    etiqueta: 'Cancelada',
  },
  cumplida: {
    fondo: '#E1F5FE',
    texto: '#0277BD',
    etiqueta: 'Cumplida',
  },
  ausente: {
    fondo: '#FFF3E0',
    texto: '#EF6C00',
    etiqueta: 'No se presentó',
  },
};

export function BadgeEstadoReserva({ estado }: { estado: EstadoReserva }) {
  const conf = CONFIG_ESTADOS[estado] ?? CONFIG_ESTADOS.confirmada;

  return (
    <View style={[estilos.badge, { backgroundColor: conf.fondo }]}>
      <Text style={[estilos.texto, { color: conf.texto }]}>{conf.etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
  },
});
