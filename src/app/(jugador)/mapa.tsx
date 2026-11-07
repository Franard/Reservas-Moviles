import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { useTheme } from '@/hooks/useTheme';

interface ComplejoMunicipalInfo {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  canchasResumen: string;
}

const COMPLEJOS_VILLAGUAY: ComplejoMunicipalInfo[] = [
  {
    id: 'polideportivo',
    nombre: 'Polideportivo Municipal',
    direccion: 'Av. Savio y Bv. Paysandú',
    latitud: -31.8643,
    longitud: -59.0282,
    descripcion: 'Centro deportivo principal: fútbol 5 y 11, básquet al aire libre y vóley sintético.',
    canchasResumen: '6 espacios disponibles',
  },
  {
    id: 'parque-berduc',
    nombre: 'Parque Berduc',
    direccion: 'Bv. San Martín y Leopoldo Herrera',
    latitud: -31.8596,
    longitud: -59.0333,
    descripcion: 'Complejo de tenis municipal en polvo de ladrillo con canchas diurnas y nocturnas.',
    canchasResumen: '2 canchas de tenis',
  },
  {
    id: 'gimnasio-cerrado',
    nombre: 'Gimnasio Cerrado Municipal',
    direccion: 'San Martín 450',
    latitud: -31.8677,
    longitud: -59.0213,
    descripcion: 'Microestadio cerrado con piso de parquet flotante para básquet, vóley y multideporte.',
    canchasResumen: '3 espacios techados',
  },
];

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function MapaComplejosScreen() {
  const { paleta } = useTheme();
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{
    latitud: number;
    longitud: number;
  } | null>(null);
  const [permisoUbicacionDenegado, setPermisoUbicacionDenegado] = useState(false);
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<ComplejoMunicipalInfo>(
    COMPLEJOS_VILLAGUAY[0]!
  );

  useEffect(() => {
    let montado = true;

    async function solicitarUbicacion() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (montado) setPermisoUbicacionDenegado(true);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (montado) {
          setUbicacionUsuario({
            latitud: loc.coords.latitude,
            longitud: loc.coords.longitude,
          });
        }
      } catch {
        if (montado) setPermisoUbicacionDenegado(true);
      }
    }

    void solicitarUbicacion();
    return () => {
      montado = false;
    };
  }, []);

  const abrirGpsNativo = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    void Linking.openURL(url);
  };

  return (
    <ThemedView style={estilos.contenedor}>
      {/* Vista Nativa de Mapa o Fallback Web */}
      {Platform.OS !== 'web' ? (
        <VistaMapaNativa
          complejos={COMPLEJOS_VILLAGUAY}
          seleccionado={complejoSeleccionado}
          alSeleccionar={setComplejoSeleccionado}
          ubicacionUsuario={ubicacionUsuario}
        />
      ) : (
        <View
          style={[
            estilos.tarjetaWebInfo,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          <Ionicons name="map-outline" size={32} color={paleta.primario} />
          <ThemedText style={[estilos.tituloWeb, { color: paleta.primario }]}>
            Complejos Municipales de Villaguay
          </ThemedText>
          <ThemedText style={[estilos.subtituloWeb, { color: paleta.textoSecundario }]}>
            Los mapas con react-native-maps se renderizan en dispositivos móviles Android e iOS.
            Podés abrir la navegación GPS en cada complejo a continuación.
          </ThemedText>
        </View>
      )}

      {/* Lista de Complejos con cálculo de distancia y acción "Cómo llegar" */}
      <ScrollView contentContainerStyle={estilos.listaComplejos}>
        {permisoUbicacionDenegado ? (
          <View style={[estilos.alertaUbicacion, { backgroundColor: paleta.superficie }]}>
            <Ionicons name="information-circle-outline" size={18} color={paleta.acento} />
            <ThemedText style={[estilos.textoAlertaUbicacion, { color: paleta.textoSecundario }]}>
              Ubicación no disponible: podés consultar las direcciones y abrir el GPS directamente.
            </ThemedText>
          </View>
        ) : null}

        {COMPLEJOS_VILLAGUAY.map((comp) => {
          const distancia = ubicacionUsuario
            ? calcularDistanciaKm(
                ubicacionUsuario.latitud,
                ubicacionUsuario.longitud,
                comp.latitud,
                comp.longitud
              )
            : null;

          const esActivo = complejoSeleccionado.id === comp.id;

          return (
            <View
              key={comp.id}
              style={[
                estilos.tarjetaComplejo,
                {
                  backgroundColor: paleta.superficie,
                  borderColor: esActivo ? paleta.primario : paleta.borde,
                  borderWidth: esActivo ? 2 : 1,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar complejo ${comp.nombre}`}
                onPress={() => setComplejoSeleccionado(comp)}
              >
                <View style={estilos.encabezadoComplejo}>
                  <View style={estilos.columnaTituloComplejo}>
                    <ThemedText style={[estilos.nombreComplejo, { color: paleta.primario }]}>
                      {comp.nombre}
                    </ThemedText>
                    <ThemedText style={[estilos.direccionComplejo, { color: paleta.textoSecundario }]}>
                      {comp.direccion}
                    </ThemedText>
                  </View>

                  {distancia !== null ? (
                    <View style={[estilos.badgeDistancia, { backgroundColor: paleta.fondo }]}>
                      <Ionicons name="navigate-circle-outline" size={14} color={paleta.primario} />
                      <ThemedText style={[estilos.textoDistancia, { color: paleta.primario }]}>
                        {distancia} km
                      </ThemedText>
                    </View>
                  ) : null}
                </View>

                <ThemedText style={[estilos.descripcionComplejo, { color: paleta.texto }]}>
                  {comp.descripcion}
                </ThemedText>
              </Pressable>

              <View style={estilos.filaAcciones}>
                <View style={[estilos.badgeCanchas, { backgroundColor: paleta.fondo }]}>
                  <Ionicons name="football-outline" size={14} color={paleta.acento} />
                  <ThemedText style={[estilos.textoCanchas, { color: paleta.texto }]}>
                    {comp.canchasResumen}
                  </ThemedText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Cómo llegar a ${comp.nombre} en Google Maps`}
                  style={[estilos.botonNavegar, { backgroundColor: paleta.primario }]}
                  onPress={() => abrirGpsNativo(comp.latitud, comp.longitud)}
                >
                  <Ionicons name="paper-plane" size={14} color={paleta.sobrePrimario} />
                  <ThemedText style={[estilos.textoBotonNavegar, { color: paleta.sobrePrimario }]}>
                    Cómo llegar
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

function VistaMapaNativa({
  complejos,
  seleccionado,
  alSeleccionar,
  ubicacionUsuario,
}: {
  complejos: ComplejoMunicipalInfo[];
  seleccionado: ComplejoMunicipalInfo;
  alSeleccionar: (c: ComplejoMunicipalInfo) => void;
  ubicacionUsuario: { latitud: number; longitud: number } | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MapView = require('react-native-maps').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Marker = require('react-native-maps').Marker;

  return (
    <View style={estilos.contenedorMapa}>
      <MapView
        style={estilos.mapa}
        region={{
          latitude: seleccionado.latitud,
          longitude: seleccionado.longitud,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={Boolean(ubicacionUsuario)}
      >
        {complejos.map((comp) => (
          <Marker
            key={comp.id}
            coordinate={{ latitude: comp.latitud, longitude: comp.longitud }}
            title={comp.nombre}
            description={comp.direccion}
            onPress={() => alSeleccionar(comp)}
            pinColor={seleccionado.id === comp.id ? '#0B3A5D' : '#0288D1'}
          />
        ))}
      </MapView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenedorMapa: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
  },
  mapa: {
    width: '100%',
    height: '100%',
  },
  tarjetaWebInfo: {
    margin: 16,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  tituloWeb: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtituloWeb: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  listaComplejos: {
    padding: 16,
    gap: 12,
  },
  alertaUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  textoAlertaUbicacion: {
    fontSize: 12,
    flexShrink: 1,
  },
  tarjetaComplejo: {
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  encabezadoComplejo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  columnaTituloComplejo: {
    flex: 1,
    paddingRight: 8,
  },
  nombreComplejo: {
    fontSize: 16,
    fontWeight: '700',
  },
  direccionComplejo: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeDistancia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoDistancia: {
    fontSize: 12,
    fontWeight: '700',
  },
  descripcionComplejo: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCanchas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  textoCanchas: {
    fontSize: 12,
    fontWeight: '600',
  },
  botonNavegar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotonNavegar: {
    fontSize: 13,
    fontWeight: '700',
  },
});
