import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useComplejosDisponibles } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';

export interface FiltroComplejosProps {
  complejoSeleccionado: string | null;
  alSeleccionar: (complejo: string | null) => void;
}

export function FiltroComplejos({
  complejoSeleccionado,
  alSeleccionar,
}: FiltroComplejosProps) {
  const { paleta } = useTheme();
  const complejos = useComplejosDisponibles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.scroll}
      contentContainerStyle={estilos.contenedor}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: complejoSeleccionado === null }}
        accessibilityLabel="Todos los complejos municipales"
        style={[
          estilos.chip,
          {
            backgroundColor:
              complejoSeleccionado === null ? paleta.acento : paleta.superficie,
            borderColor:
              complejoSeleccionado === null ? paleta.acento : paleta.borde,
          },
        ]}
        onPress={() => alSeleccionar(null)}
      >
        <Ionicons
          name="location-outline"
          size={14}
          color={
            complejoSeleccionado === null ? '#FFFFFF' : paleta.textoSecundario
          }
        />
        <ThemedText
          style={[
            estilos.texto,
            {
              color:
                complejoSeleccionado === null ? '#FFFFFF' : paleta.textoSecundario,
            },
          ]}
        >
          Todos los complejos
        </ThemedText>
      </Pressable>

      {complejos.map((comp) => {
        const activo = complejoSeleccionado === comp;
        return (
          <Pressable
            key={comp}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`Filtrar por complejo ${comp}`}
            style={[
              estilos.chip,
              {
                backgroundColor: activo ? paleta.acento : paleta.superficie,
                borderColor: activo ? paleta.acento : paleta.borde,
              },
            ]}
            onPress={() => alSeleccionar(activo ? null : comp)}
          >
            <ThemedText
              style={[
                estilos.texto,
                { color: activo ? '#FFFFFF' : paleta.textoSecundario },
              ]}
            >
              {comp}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 42,
    maxHeight: 42,
    marginBottom: 8,
  },
  contenedor: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 18,
    borderWidth: 1,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
