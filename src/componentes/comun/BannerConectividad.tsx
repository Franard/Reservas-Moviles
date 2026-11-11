import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useConectividad } from '@/hooks/useConectividad';
import { useTheme } from '@/hooks/useTheme';

export function BannerConectividad() {
  const { conectado, internetAlcanzable } = useConectividad();
  const { paleta } = useTheme();
  const insets = useSafeAreaInsets();

  if (conectado && internetAlcanzable) {
    return null;
  }

  const alReverificar = async () => {
    try {
      await Network.getNetworkStateAsync();
    } catch {
      // Ignorar
    }
  };

  return (
    <View
      style={[
        estilos.contenedor,
        {
          backgroundColor: paleta.peligro,
          paddingTop: Math.max(insets.top, 6) + 4,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={estilos.fila}>
        <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
        <ThemedText style={estilos.texto}>
          Sin conexión — Consultando espacios y códigos QR guardados en este dispositivo
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar comprobar conexión a internet"
        onPress={alReverificar}
        style={estilos.botonReintentar}
      >
        <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  fila: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  botonReintentar: {
    padding: 4,
    borderRadius: 4,
  },
});
