import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useAlternarFavorito, useFavoritosIds } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { Espacio } from '@/tipos';

export interface TarjetaEspacioResumenProps {
  espacio: Espacio;
  alPresionar?: (espacio: Espacio) => void;
}

export function TarjetaEspacioResumen({
  espacio,
  alPresionar,
}: TarjetaEspacioResumenProps) {
  const { paleta } = useTheme();
  const favoritosIds = useFavoritosIds();
  const { mutate: alternarFavorito, isPending: alternando } = useAlternarFavorito();

  const esFavorito = favoritosIds.includes(espacio.id);
  const imagenPrincipal =
    espacio.imagenes[0] ??
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80';

  return (
    <View
      style={[
        estilos.tarjeta,
        {
          backgroundColor: paleta.superficie,
          borderColor: paleta.borde,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Cancha ${espacio.nombre}, ${espacio.complejo}, precio $${espacio.precioPorHora} por hora`}
        style={({ pressed }) => [
          estilos.areaPresionable,
          { opacity: pressed ? 0.94 : 1 },
        ]}
        onPress={() => alPresionar?.(espacio)}
      >
        <View style={estilos.contenedorImagen}>
          <Image
            source={{ uri: imagenPrincipal }}
            style={estilos.imagen}
            contentFit="cover"
            transition={300}
          />

          <View style={estilos.badgeComplejo}>
            <ThemedText style={estilos.badgeComplejoTexto}>{espacio.complejo}</ThemedText>
          </View>

          {espacio.videoUrl ? (
            <View style={estilos.badgeVideo}>
              <Ionicons name="play-circle" size={13} color="#FFFFFF" />
              <ThemedText style={estilos.badgeVideoTexto}>Video</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={estilos.cuerpo}>
          <View style={estilos.filaPrincipal}>
            <ThemedText style={[estilos.nombre, { color: paleta.primario }]} numberOfLines={1}>
              {espacio.nombre}
            </ThemedText>
            <ThemedText style={[estilos.precio, { color: paleta.exito }]}>
              ${espacio.precioPorHora.toLocaleString('es-AR')}
              <ThemedText style={[estilos.precioPorHora, { color: paleta.textoSecundario }]}>
                /h
              </ThemedText>
            </ThemedText>
          </View>

          <View style={estilos.etiquetas}>
            <View style={[estilos.etiqueta, { backgroundColor: paleta.fondo }]}>
              <Ionicons name="layers-outline" size={13} color={paleta.primario} />
              <ThemedText style={[estilos.etiquetaTexto, { color: paleta.texto }]}>
                {espacio.superficie}
              </ThemedText>
            </View>

            <View style={[estilos.etiqueta, { backgroundColor: paleta.fondo }]}>
              <Ionicons
                name={espacio.iluminacion ? 'bulb-outline' : 'sunny-outline'}
                size={13}
                color={espacio.iluminacion ? paleta.acento : paleta.textoSecundario}
              />
              <ThemedText style={[estilos.etiquetaTexto, { color: paleta.texto }]}>
                {espacio.iluminacion ? 'Con luz' : 'Solo diurno'}
              </ThemedText>
            </View>

            {espacio.techado ? (
              <View style={[estilos.etiqueta, { backgroundColor: paleta.fondo }]}>
                <Ionicons name="home-outline" size={13} color={paleta.primario} />
                <ThemedText style={[estilos.etiquetaTexto, { color: paleta.texto }]}>
                  Techado
                </ThemedText>
              </View>
            ) : null}

            <View style={[estilos.etiqueta, { backgroundColor: paleta.fondo }]}>
              <Ionicons name="people-outline" size={13} color={paleta.primario} />
              <ThemedText style={[estilos.etiquetaTexto, { color: paleta.texto }]}>
                Hasta {espacio.capacidad}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Botón de favoritos flotante */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          esFavorito
            ? `Quitar ${espacio.nombre} de favoritos`
            : `Agregar ${espacio.nombre} a favoritos`
        }
        style={[estilos.botonFavorito, { backgroundColor: paleta.superficie }]}
        onPress={() => {
          if (!alternando) {
            alternarFavorito(espacio.id);
          }
        }}
      >
        <Ionicons
          name={esFavorito ? 'heart' : 'heart-outline'}
          size={20}
          color={esFavorito ? paleta.peligro : paleta.textoSecundario}
        />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    position: 'relative',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  areaPresionable: {
    width: '100%',
  },
  contenedorImagen: {
    height: 145,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0B3A5D',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  botonFavorito: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  badgeComplejo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeComplejoTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeVideo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#0288D1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeVideoTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cuerpo: {
    padding: 14,
  },
  filaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  precio: {
    fontSize: 16,
    fontWeight: '800',
  },
  precioPorHora: {
    fontSize: 12,
    fontWeight: '500',
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etiquetaTexto: {
    fontSize: 12,
    fontWeight: '500',
  },
});
