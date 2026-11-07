import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useDeportes } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';

type NombreIcono = React.ComponentProps<typeof Ionicons>['name'];

export interface FiltroDeportesProps {
  deporteSeleccionadoId: string | null;
  alSeleccionar: (deporteId: string | null) => void;
}

export function FiltroDeportes({
  deporteSeleccionadoId,
  alSeleccionar,
}: FiltroDeportesProps) {
  const { paleta } = useTheme();
  const { data: deportes } = useDeportes();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.scroll}
      contentContainerStyle={estilos.contenedor}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: deporteSeleccionadoId === null }}
        accessibilityLabel="Todos los deportes"
        style={[
          estilos.chip,
          {
            backgroundColor:
              deporteSeleccionadoId === null ? paleta.primario : paleta.superficie,
            borderColor:
              deporteSeleccionadoId === null ? paleta.primario : paleta.borde,
          },
        ]}
        onPress={() => alSeleccionar(null)}
      >
        <Ionicons
          name="apps-outline"
          size={16}
          color={
            deporteSeleccionadoId === null ? paleta.sobrePrimario : paleta.texto
          }
        />
        <ThemedText
          style={[
            estilos.texto,
            {
              color:
                deporteSeleccionadoId === null
                  ? paleta.sobrePrimario
                  : paleta.texto,
            },
          ]}
        >
          Todos
        </ThemedText>
      </Pressable>

      {(deportes ?? []).map((dep) => {
        const activo = deporteSeleccionadoId === dep.id;
        return (
          <Pressable
            key={dep.id}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`Filtrar por deporte ${dep.nombre}`}
            style={[
              estilos.chip,
              {
                backgroundColor: activo ? paleta.primario : paleta.superficie,
                borderColor: activo ? paleta.primario : paleta.borde,
              },
            ]}
            onPress={() => alSeleccionar(activo ? null : dep.id)}
          >
            <Ionicons
              name={(dep.icono as NombreIcono) ?? 'football-outline'}
              size={16}
              color={activo ? paleta.sobrePrimario : dep.color}
            />
            <ThemedText
              style={[
                estilos.texto,
                { color: activo ? paleta.sobrePrimario : paleta.texto },
              ]}
            >
              {dep.nombre}
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
    height: 48,
    maxHeight: 48,
    marginBottom: 6,
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
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
  },
  texto: {
    fontSize: 13,
    fontWeight: '600',
  },
});
