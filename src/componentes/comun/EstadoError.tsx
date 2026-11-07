import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';

export interface EstadoErrorProps {
  titulo?: string;
  mensaje: string;
  codigoError?: string;
  textoReintentar?: string;
  alReintentar?: () => void;
}

export function EstadoError({
  titulo = 'No pudimos completar la consulta',
  mensaje,
  codigoError,
  textoReintentar = 'Reintentar',
  alReintentar,
}: EstadoErrorProps) {
  const { paleta } = useTheme();

  return (
    <View
      style={[estilos.contenedor, { backgroundColor: paleta.fondo }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View
        style={[
          estilos.circuloIcono,
          { backgroundColor: paleta.superficie, borderColor: paleta.peligro },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={36} color={paleta.peligro} />
      </View>

      <ThemedText style={estilos.titulo}>{titulo}</ThemedText>

      <ThemedText style={[estilos.mensaje, { color: paleta.textoSecundario }]}>
        {mensaje}
      </ThemedText>

      {codigoError ? (
        <ThemedText style={[estilos.codigo, { color: paleta.peligro }]}>
          Código: {codigoError}
        </ThemedText>
      ) : null}

      {alReintentar ? (
        <Pressable
          onPress={alReintentar}
          accessibilityRole="button"
          accessibilityLabel={textoReintentar}
          style={({ pressed }) => [
            estilos.boton,
            { backgroundColor: paleta.primario, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={18} color={paleta.sobrePrimario} />
          <ThemedText style={[estilos.textoBoton, { color: paleta.sobrePrimario }]}>
            {textoReintentar}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  circuloIcono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  codigo: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  textoBoton: {
    fontSize: 14,
    fontWeight: '700',
  },
});
