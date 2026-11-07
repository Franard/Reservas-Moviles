import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoError } from '@/componentes/comun/EstadoError';
import { EstadoVacio } from '@/componentes/comun/EstadoVacio';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { TarjetaReservaResumen } from '@/componentes/reservas/TarjetaReservaResumen';
import { useAuth } from '@/hooks/useAuth';
import { useMisReservas } from '@/hooks/useReservas';
import { useTheme } from '@/hooks/useTheme';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function MisReservasScreen() {
  const { usuario } = useAuth();
  const { paleta } = useTheme();
  const [pestana, setPestana] = useState<'proximas' | 'historial'>('proximas');

  const { data, isLoading, isError, error, refetch } = useMisReservas();

  if (!usuario) {
    return (
      <ThemedView style={estilos.contenedor}>
        <EstadoVacio
          icono="person-circle-outline"
          titulo="Iniciá sesión para ver tus reservas"
          descripcion="Tus turnos confirmados, códigos QR offline y el historial de asistencias se sincronizan con tu cuenta."
          textoAccion="Iniciar sesión ahora"
          alAccionar={() => router.push('/(auth)/login?redirigir=/(jugador)/reservas')}
        />
      </ThemedView>
    );
  }

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando tus reservas deportivas..." />;
  }

  if (isError) {
    const info = extraerInfoErrorUI(error, 'No pudimos obtener tus reservas.');
    return (
      <EstadoError
        mensaje={info.mensaje}
        codigoError={info.codigo}
        alReintentar={() => {
          void refetch();
        }}
      />
    );
  }

  const reservasAMostrar = pestana === 'proximas' ? data?.proximas ?? [] : data?.pasadas ?? [];

  return (
    <ThemedView style={estilos.contenedor}>
      {/* Selector de pestañas */}
      <View style={[estilos.filaPestanas, { borderBottomColor: paleta.borde }]}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: pestana === 'proximas' }}
          style={[
            estilos.pestana,
            pestana === 'proximas' && [estilos.pestanaActiva, { borderBottomColor: paleta.primario }],
          ]}
          onPress={() => setPestana('proximas')}
        >
          <ThemedText
            style={[
              estilos.textoPestana,
              pestana === 'proximas'
                ? { color: paleta.primario, fontWeight: '700' }
                : { color: paleta.textoSecundario },
            ]}
          >
            Próximas ({data?.proximas.length ?? 0})
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: pestana === 'historial' }}
          style={[
            estilos.pestana,
            pestana === 'historial' && [
              estilos.pestanaActiva,
              { borderBottomColor: paleta.primario },
            ],
          ]}
          onPress={() => setPestana('historial')}
        >
          <ThemedText
            style={[
              estilos.textoPestana,
              pestana === 'historial'
                ? { color: paleta.primario, fontWeight: '700' }
                : { color: paleta.textoSecundario },
            ]}
          >
            Historial ({data?.pasadas.length ?? 0})
          </ThemedText>
        </Pressable>
      </View>

      {/* Indicador de límite de reservas activas */}
      {pestana === 'proximas' && (data?.activasCount ?? 0) > 0 ? (
        <View style={estilos.barraContador}>
          <ThemedText style={[estilos.textoContador, { color: paleta.textoSecundario }]}>
            Tenés {data?.activasCount} de {data?.maxActivasPermitidas} reservas activas simultáneas
          </ThemedText>
        </View>
      ) : null}

      <FlatList
        data={reservasAMostrar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          reservasAMostrar.length === 0 ? estilos.listaVacia : estilos.lista
        }
        ListEmptyComponent={
          <EstadoVacio
            icono={pestana === 'proximas' ? 'calendar-outline' : 'time-outline'}
            titulo={
              pestana === 'proximas'
                ? 'No tenés reservas próximas'
                : 'Aún no tenés historial de turnos'
            }
            descripcion={
              pestana === 'proximas'
                ? 'Explorá las canchas municipales de Villaguay y reservá en 2 toques.'
                : 'Tus turnos cumplidos o cancelados aparecerán registrados aquí.'
            }
            textoAccion={pestana === 'proximas' ? 'Explorar espacios' : undefined}
            alAccionar={pestana === 'proximas' ? () => router.push('/(jugador)') : undefined}
          />
        }
        renderItem={({ item }) => (
          <TarjetaReservaResumen
            reserva={item}
            alPresionar={(res) => router.push(`/(jugador)/reservas/${res.id}`)}
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
  filaPestanas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  pestana: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  pestanaActiva: {},
  textoPestana: {
    fontSize: 14,
  },
  barraContador: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  textoContador: {
    fontSize: 12,
    fontWeight: '600',
  },
  lista: {
    padding: 16,
  },
  listaVacia: {
    flexGrow: 1,
  },
});
