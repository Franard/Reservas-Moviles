import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoError } from '@/componentes/comun/EstadoError';
import { EstadoVacio } from '@/componentes/comun/EstadoVacio';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { FiltroComplejos } from '@/componentes/espacios/FiltroComplejos';
import { FiltroDeportes } from '@/componentes/espacios/FiltroDeportes';
import { TarjetaEspacioResumen } from '@/componentes/espacios/TarjetaEspacioResumen';
import { useEspacios } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { FiltrosEspacio } from '@/tipos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function CatalogoEspaciosScreen() {
  const { paleta } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [deporteId, setDeporteId] = useState<string | null>(null);
  const [complejo, setComplejo] = useState<string | null>(null);
  const [soloFavoritos, setSoloFavoritos] = useState(false);

  const filtros = useMemo<FiltrosEspacio>(
    () => ({
      busqueda: busqueda.trim() ? busqueda.trim() : undefined,
      deporteId,
      complejo,
      soloFavoritos,
    }),
    [busqueda, deporteId, complejo, soloFavoritos]
  );

  const { data, isLoading, isError, error, refetch } = useEspacios(filtros);

  const hayFiltrosActivos = Boolean(
    busqueda.trim() || deporteId !== null || complejo !== null || soloFavoritos
  );

  const limpiarFiltros = () => {
    setBusqueda('');
    setDeporteId(null);
    setComplejo(null);
    setSoloFavoritos(false);
  };

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando espacios municipales de Villaguay..." />;
  }

  if (isError) {
    const infoError = extraerInfoErrorUI(error, 'Error al cargar el catálogo de espacios.');
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

  return (
    <ThemedView style={estilos.contenedor}>
      <View style={estilos.barraSuperior}>
        <View
          style={[
            estilos.cajaBusqueda,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={paleta.textoSecundario} />
          <TextInput
            style={[estilos.inputBusqueda, { color: paleta.texto }]}
            placeholder="Buscar cancha, deporte o complejo..."
            placeholderTextColor={paleta.textoSecundario}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            accessibilityLabel="Buscar espacios deportivos"
          />
          {busqueda.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setBusqueda('')}
              style={estilos.botonBorrar}
            >
              <Ionicons name="close-circle" size={18} color={paleta.textoSecundario} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtrar solo favoritos"
          style={[
            estilos.botonFiltroFavorito,
            {
              backgroundColor: soloFavoritos ? paleta.peligro : paleta.superficie,
              borderColor: soloFavoritos ? paleta.peligro : paleta.borde,
            },
          ]}
          onPress={() => setSoloFavoritos((prev) => !prev)}
        >
          <Ionicons
            name={soloFavoritos ? 'heart' : 'heart-outline'}
            size={20}
            color={soloFavoritos ? '#FFFFFF' : paleta.peligro}
          />
        </Pressable>
      </View>

      <FiltroDeportes
        deporteSeleccionadoId={deporteId}
        alSeleccionar={setDeporteId}
      />

      <FiltroComplejos
        complejoSeleccionado={complejo}
        alSeleccionar={setComplejo}
      />

      <View style={estilos.barraResultados}>
        <ThemedText style={[estilos.textoResultados, { color: paleta.textoSecundario }]}>
          {data?.length ?? 0} {data?.length === 1 ? 'espacio encontrado' : 'espacios encontrados'}
        </ThemedText>
        {hayFiltrosActivos ? (
          <Pressable onPress={limpiarFiltros}>
            <ThemedText style={[estilos.textoLimpiar, { color: paleta.acento }]}>
              Limpiar filtros
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          (data?.length ?? 0) === 0 ? estilos.listaVacia : estilos.lista
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="search-outline"
            titulo="Sin espacios encontrados"
            descripcion={
              soloFavoritos
                ? 'No tenés ningún espacio guardado como favorito todavía. Tocá el corazón en las canchas que más uses.'
                : 'No encontramos canchas con el criterio de búsqueda seleccionado.'
            }
            textoAccion={hayFiltrosActivos ? 'Ver todos los espacios' : undefined}
            alAccionar={hayFiltrosActivos ? limpiarFiltros : undefined}
          />
        }
        renderItem={({ item }) => (
          <TarjetaEspacioResumen
            espacio={item}
            alPresionar={(esp) => router.push(`/(jugador)/espacios/${esp.id}`)}
          />
        )}
      />
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  barraSuperior: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  cajaBusqueda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
  },
  inputBusqueda: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
  botonBorrar: {
    padding: 4,
  },
  botonFiltroFavorito: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraResultados: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textoResultados: {
    fontSize: 12,
    fontWeight: '600',
  },
  textoLimpiar: {
    fontSize: 12,
    fontWeight: '700',
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listaVacia: {
    flexGrow: 1,
  },
});
