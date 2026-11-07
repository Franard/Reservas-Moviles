import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EstadoTurno } from '@/tipos';

interface Props {
  estado: EstadoTurno;
}

const CONFIG_ESTADO: Record<EstadoTurno, { etiqueta: string; fondo: string; texto: string }> = {
  libre: { etiqueta: 'LIBRE', fondo: '#E8F5E9', texto: '#1B5E20' },
  reservado: { etiqueta: 'OCUPADO', fondo: '#ECEFF1', texto: '#455A64' },
  fijo: { etiqueta: 'FIJO', fondo: '#FFF8E1', texto: '#E65100' },
  mantenimiento: { etiqueta: 'BLOQUEADO', fondo: '#FFEBEE', texto: '#B71C1C' },
};

export function BadgeEstadoTurno({ estado }: Props) {
  const cfg = CONFIG_ESTADO[estado];
  return (
    <View style={[estilos.badge, { backgroundColor: cfg.fondo }]}>
      <Text style={[estilos.texto, { color: cfg.texto }]}>{cfg.etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  texto: {
    fontSize: 11,
    fontWeight: '700',
  },
});

