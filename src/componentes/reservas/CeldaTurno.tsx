import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { Turno } from '@/tipos';
import { BadgeEstadoTurno } from './BadgeEstadoTurno';

export interface CeldaTurnoProps {
  turno: Turno;
  alSeleccionar: (turno: Turno) => void;
}

export function CeldaTurno({ turno, alSeleccionar }: CeldaTurnoProps) {
  const { paleta } = useTheme();
  const esLibre = turno.estado === 'libre';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Turno de ${turno.inicio} a ${turno.fin}, estado ${turno.estado}`}
      accessibilityState={{ disabled: !esLibre }}
      disabled={!esLibre}
      style={({ pressed }) => [
        estilos.fila,
        {
          backgroundColor: paleta.superficie,
          borderColor: esLibre ? paleta.primario : paleta.borde,
          borderWidth: esLibre ? 1.5 : 1,
          opacity: esLibre ? (pressed ? 0.85 : 1) : 0.9,
        },
      ]}
      onPress={() => alSeleccionar(turno)}
    >
      <View style={estilos.columnaInfo}>
        <View style={estilos.filaHorario}>
          <ThemedText style={[estilos.horario, { color: paleta.primario }]}>
            {turno.inicio} a {turno.fin} hs
          </ThemedText>
          {esLibre ? (
            <View style={[estilos.badgeLibreAccion, { backgroundColor: paleta.exito }]}>
              <ThemedText style={estilos.textoBadgeLibre}>Disponible</ThemedText>
            </View>
          ) : null}
        </View>

        {turno.motivoBloqueo ? (
          <ThemedText style={[estilos.motivo, { color: paleta.textoSecundario }]}>
            {turno.motivoBloqueo}
          </ThemedText>
        ) : (
          <ThemedText style={[estilos.precio, { color: paleta.exito }]}>
            ${(turno.precio ?? 0).toLocaleString('es-AR')} por turno
          </ThemedText>
        )}
      </View>

      <View style={estilos.columnaEstado}>
        {esLibre ? (
          <View style={[estilos.botonReservarPill, { backgroundColor: paleta.primario }]}>
            <ThemedText style={[estilos.textoReservarPill, { color: paleta.sobrePrimario }]}>
              Reservar
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={paleta.sobrePrimario} />
          </View>
        ) : (
          <BadgeEstadoTurno estado={turno.estado} />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnaInfo: {
    flex: 1,
    paddingRight: 10,
  },
  filaHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  horario: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeLibreAccion: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBadgeLibre: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  precio: {
    fontSize: 13,
    fontWeight: '600',
  },
  motivo: {
    fontSize: 12,
  },
  columnaEstado: {
    alignItems: 'flex-end',
  },
  botonReservarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoReservarPill: {
    fontSize: 13,
    fontWeight: '700',
  },
});
