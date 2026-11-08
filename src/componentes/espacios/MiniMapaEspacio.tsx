import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useConectividad } from '@/hooks/useConectividad';
import { useTheme } from '@/hooks/useTheme';

interface MiniMapaEspacioProps {
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  nombreEspacio: string;
  complejo?: string;
}

export function MiniMapaEspacio({
  coordenadas,
  nombreEspacio,
  complejo = 'Complejo Municipal',
}: MiniMapaEspacioProps) {
  const { paleta } = useTheme();
  const { conectado } = useConectividad();

  const abrirEnGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coordenadas.latitud},${coordenadas.longitud}`;
    void Linking.openURL(url);
  };

  return (
    <View
      style={[
        estilos.contenedor,
        { backgroundColor: paleta.superficie, borderColor: paleta.borde },
      ]}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.filaTitulo}>
          <Ionicons name="location" size={18} color={paleta.primario} />
          <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
            Ubicación en Villaguay
          </ThemedText>
        </View>
        <ThemedText style={[estilos.direccion, { color: paleta.textoSecundario }]}>
          {complejo}
        </ThemedText>
      </View>

      {/* Vista del Mapa */}
      {Platform.OS !== 'web' && conectado ? (
        <VistaMiniMapaNativo
          coordenadas={coordenadas}
          nombreEspacio={nombreEspacio}
          complejo={complejo}
        />
      ) : (
        <View
          style={[
            estilos.cajaPlaceholder,
            { backgroundColor: paleta.fondo, borderColor: paleta.borde },
          ]}
        >
          <Ionicons
            name={!conectado ? 'cloud-offline-outline' : 'map-outline'}
            size={28}
            color={paleta.textoSecundario}
          />
          <ThemedText style={[estilos.textoPlaceholder, { color: paleta.textoSecundario }]}>
            {!conectado
              ? 'Mapa no disponible sin conexión. Podés consultar la dirección arriba.'
              : `${nombreEspacio} — ${complejo}`}
          </ThemedText>
        </View>
      )}

      {/* Botón Cómo llegar */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir cómo llegar a ${nombreEspacio} en GPS`}
        style={[estilos.botonComoLlegar, { backgroundColor: paleta.primario }]}
        onPress={abrirEnGoogleMaps}
      >
        <Ionicons name="navigate-outline" size={16} color={paleta.sobrePrimario} />
        <ThemedText style={[estilos.textoBoton, { color: paleta.sobrePrimario }]}>
          Cómo llegar (GPS)
        </ThemedText>
      </Pressable>
    </View>
  );
}

function VistaMiniMapaNativo({
  coordenadas,
  nombreEspacio,
  complejo,
}: {
  coordenadas: { latitud: number; longitud: number };
  nombreEspacio: string;
  complejo: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Maps = require('react-native-maps');
  const MapView = Maps.default || Maps;
  const Marker = Maps.Marker;
  const UrlTile = Maps.UrlTile;

  return (
    <View style={estilos.mapaContenedor}>
      <MapView
        style={estilos.mapa}
        mapType="none"
        region={{
          latitude: coordenadas.latitud,
          longitude: coordenadas.longitud,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <UrlTile
          urlTemplate="https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />
        <Marker
          coordinate={{
            latitude: coordenadas.latitud,
            longitude: coordenadas.longitud,
          }}
          title={nombreEspacio}
          description={complejo}
          pinColor="#0B3A5D"
        />
      </MapView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  encabezado: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 2,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  direccion: {
    fontSize: 13,
  },
  mapaContenedor: {
    width: '100%',
    height: 170,
    backgroundColor: '#E0E0E0',
  },
  mapa: {
    width: '100%',
    height: '100%',
  },
  cajaPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  textoPlaceholder: {
    fontSize: 12,
    textAlign: 'center',
  },
  botonComoLlegar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    marginHorizontal: 14,
    marginVertical: 12,
    borderRadius: 10,
  },
  textoBoton: {
    fontSize: 13,
    fontWeight: '700',
  },
});
