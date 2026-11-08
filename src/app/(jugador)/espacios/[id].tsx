import React from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoError } from '@/componentes/comun/EstadoError';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { MiniMapaEspacio } from '@/componentes/espacios/MiniMapaEspacio';
import { ReproductorVideoEspacio } from '@/componentes/espacios/ReproductorVideoEspacio';
import {
  useAlternarFavorito,
  useEspacioDetalle,
  useFavoritosIds,
} from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

const ANCHO_PANTALLA = Dimensions.get('window').width;

export default function DetalleEspacioScreen() {
  const params = useLocalSearchParams<{ id?: string; espacioId?: string }>();
  const rawId = params.id ?? params.espacioId;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');
  const { paleta } = useTheme();
  const { data: espacio, isLoading, isError, error, refetch } = useEspacioDetalle(id);
  const favoritosIds = useFavoritosIds();
  const { mutate: alternarFavorito, isPending: alternando } = useAlternarFavorito();

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando ficha del espacio deportivo..." />;
  }

  if (isError || !espacio) {
    const infoError = extraerInfoErrorUI(
      error,
      'No se pudo obtener la información del espacio deportivo.'
    );
    return (
      <EstadoError
        mensaje={infoError.mensaje}
        codigoError={infoError.codigo}
        alReintentar={() => {
          void refetch();
        }}
      />
    );
  }

  const esFavorito = favoritosIds.includes(espacio.id);

  const abrirEnGoogleMaps = () => {
    const { latitud, longitud } = espacio.coordenadas;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
    void Linking.openURL(url);
  };

  return (
    <ScrollView
      style={[estilos.contenedor, { backgroundColor: paleta.fondo }]}
      contentContainerStyle={estilos.contenido}
    >
      {/* Carrusel de Fotos */}
      <View style={estilos.seccionFotos}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={estilos.carrusel}
        >
          {espacio.imagenes.map((url, idx) => (
            <Image
              key={`${url}-${idx}`}
              source={{ uri: url }}
              style={estilos.fotoCarrusel}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>

        {/* Botón flotante de Favorito */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'
          }
          style={[estilos.botonFavorito, { backgroundColor: paleta.superficie }]}
          onPress={() => {
            if (!alternando) alternarFavorito(espacio.id);
          }}
        >
          <Ionicons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={22}
            color={esFavorito ? paleta.peligro : paleta.textoSecundario}
          />
        </Pressable>

        <View style={estilos.indicadorFotos}>
          <ThemedText style={estilos.textoIndicadorFotos}>
            {espacio.imagenes.length} {espacio.imagenes.length === 1 ? 'foto' : 'fotos'}
          </ThemedText>
        </View>
      </View>

      {/* Encabezado Principal */}
      <View style={estilos.encabezado}>
        <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
          {espacio.nombre}
        </ThemedText>
        <ThemedText style={[estilos.complejo, { color: paleta.textoSecundario }]}>
          {espacio.complejo} · Villaguay, Entre Ríos
        </ThemedText>
        <View style={estilos.filaPrecio}>
          <ThemedText style={[estilos.precio, { color: paleta.exito }]}>
            ${espacio.precioPorHora.toLocaleString('es-AR')}
          </ThemedText>
          <ThemedText style={[estilos.precioSubtexto, { color: paleta.textoSecundario }]}>
            por turno de 1 hora (abono presencial en portería)
          </ThemedText>
        </View>
      </View>

      {/* Botones de Acción Primaria */}
      <View style={estilos.filaBotonesAccion}>
        <Pressable
          style={[estilos.botonPrimario, { backgroundColor: paleta.primario }]}
          accessibilityRole="button"
          accessibilityLabel="Consultar disponibilidad y reservar turno"
          onPress={() => router.push(`/(jugador)/disponibilidades/${espacio.id}`)}
        >
          <Ionicons name="calendar" size={18} color={paleta.sobrePrimario} />
          <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
            Ver disponibilidad (7 días)
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            estilos.botonComoLlegar,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cómo llegar con GPS"
          onPress={abrirEnGoogleMaps}
        >
          <Ionicons name="navigate-outline" size={18} color={paleta.acento} />
          <ThemedText style={[estilos.textoComoLlegar, { color: paleta.acento }]}>
            Cómo llegar (GPS)
          </ThemedText>
        </Pressable>
      </View>

      {/* Reproductor de Video de Recorrido con expo-video */}
      <ThemedText style={[estilos.seccionTitulo, { color: paleta.primario }]}>
        Recorrido audiovisual
      </ThemedText>
      <ReproductorVideoEspacio
        videoUrl={espacio.videoUrl}
        tituloEspacio={espacio.nombre}
      />

      {/* Características del espacio */}
      <View
        style={[
          estilos.bloque,
          { backgroundColor: paleta.superficie, borderColor: paleta.borde },
        ]}
      >
        <ThemedText style={[estilos.subtitulo, { color: paleta.primario }]}>
          Características de la cancha
        </ThemedText>

        <View style={estilos.filaCaracteristica}>
          <Ionicons name="layers-outline" size={18} color={paleta.primario} />
          <ThemedText style={estilos.detalle}>Superficie: {espacio.superficie}</ThemedText>
        </View>

        <View style={estilos.filaCaracteristica}>
          <Ionicons name="people-outline" size={18} color={paleta.primario} />
          <ThemedText style={estilos.detalle}>
            Capacidad máxima: {espacio.capacidad} jugadores
          </ThemedText>
        </View>

        <View style={estilos.filaCaracteristica}>
          <Ionicons
            name={espacio.iluminacion ? 'bulb-outline' : 'sunny-outline'}
            size={18}
            color={espacio.iluminacion ? paleta.acento : paleta.textoSecundario}
          />
          <ThemedText style={estilos.detalle}>
            Iluminación artificial: {espacio.iluminacion ? 'Habilitada para turnos nocturnos' : 'No disponible (solo diurno)'}
          </ThemedText>
        </View>

        <View style={estilos.filaCaracteristica}>
          <Ionicons name="home-outline" size={18} color={paleta.primario} />
          <ThemedText style={estilos.detalle}>
            Techado: {espacio.techado ? 'Gimnasio techado' : 'Al aire libre'}
          </ThemedText>
        </View>
      </View>

      {/* Reglas del lugar */}
      <View
        style={[
          estilos.bloque,
          { backgroundColor: paleta.superficie, borderColor: paleta.borde },
        ]}
      >
        <ThemedText style={[estilos.subtitulo, { color: paleta.primario }]}>
          Reglamento de uso
        </ThemedText>
        <ThemedText style={[estilos.reglasTexto, { color: paleta.texto }]}>
          {espacio.reglas}
        </ThemedText>
      </View>

      {/* Mini Mapa Interactivo de Ubicación */}
      <MiniMapaEspacio
        coordenadas={espacio.coordenadas}
        nombreEspacio={espacio.nombre}
        complejo={espacio.complejo}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    paddingBottom: 36,
  },
  seccionFotos: {
    position: 'relative',
    height: 220,
    width: '100%',
    backgroundColor: '#0B3A5D',
  },
  carrusel: {
    width: '100%',
    height: '100%',
  },
  fotoCarrusel: {
    width: ANCHO_PANTALLA,
    height: 220,
  },
  botonFavorito: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  indicadorFotos: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoIndicadorFotos: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  encabezado: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  complejo: {
    fontSize: 14,
    marginTop: 4,
  },
  filaPrecio: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 10,
  },
  precio: {
    fontSize: 20,
    fontWeight: '800',
  },
  precioSubtexto: {
    fontSize: 13,
    flexShrink: 1,
  },
  filaBotonesAccion: {
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 20,
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  botonTexto: {
    fontWeight: '700',
    fontSize: 15,
  },
  botonComoLlegar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textoComoLlegar: {
    fontWeight: '700',
    fontSize: 14,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  bloque: {
    marginHorizontal: 18,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  filaCaracteristica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  detalle: {
    fontSize: 14,
    flexShrink: 1,
  },
  reglasTexto: {
    fontSize: 14,
    lineHeight: 20,
  },
});
