import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';

type NombreIconoIonicons = React.ComponentProps<typeof Ionicons>['name'];

export interface EstadoVacioProps {
  icono?: NombreIconoIonicons;
  titulo: string;
  descripcion?: string;
  textoAccion?: string;
  alAccionar?: () => void;
}

export function EstadoVacio({
  icono = 'calendar-clear-outline',
  titulo,
  descripcion,
  textoAccion,
  alAccionar,
}: EstadoVacioProps) {
  const { paleta } = useTheme();

  return (
    <View style={[estilos.contenedor, { backgroundColor: paleta.fondo }]}>
      <View
        style={[
          estilos.circuloIcono,
          { backgroundColor: paleta.superficie, borderColor: paleta.borde },
        ]}
      >
        <Ionicons name={icono} size={36} color={paleta.primario} />
      </View>

      <ThemedText style={estilos.titulo}>{titulo}</ThemedText>

      {descripcion ? (
        <ThemedText style={[estilos.descripcion, { color: paleta.textoSecundario }]}>
          {descripcion}
        </ThemedText>
      ) : null}

      {textoAccion && alAccionar ? (
        <Pressable
          onPress={alAccionar}
          accessibilityRole="button"
          accessibilityLabel={textoAccion}
          style={({ pressed }) => [
            estilos.boton,
            { backgroundColor: paleta.primario, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText style={[estilos.textoBoton, { color: paleta.sobrePrimario }]}>
            {textoAccion}
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
    borderWidth: 1,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  boton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  textoBoton: {
    fontSize: 14,
    fontWeight: '700',
  },
});
