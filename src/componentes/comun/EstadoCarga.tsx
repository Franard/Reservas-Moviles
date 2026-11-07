import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';

export interface EstadoCargaProps {
  mensaje?: string;
  compacto?: boolean;
}

export function EstadoCarga({
  mensaje = 'Cargando información...',
  compacto = false,
}: EstadoCargaProps) {
  const { paleta } = useTheme();

  return (
    <View
      style={[
        estilos.contenedor,
        compacto ? estilos.contenedorCompacto : estilos.contenedorPantalla,
        { backgroundColor: compacto ? 'transparent' : paleta.fondo },
      ]}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={mensaje}
    >
      <ActivityIndicator size={compacto ? 'small' : 'large'} color={paleta.primario} />
      {mensaje ? (
        <ThemedText style={[estilos.mensaje, { color: paleta.textoSecundario }]}>
          {mensaje}
        </ThemedText>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenedorPantalla: {
    flex: 1,
    padding: 24,
  },
  contenedorCompacto: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  mensaje: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
