import React, { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoError } from '@/componentes/comun/EstadoError';
import { EstadoVacio } from '@/componentes/comun/EstadoVacio';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { CeldaTurno } from '@/componentes/reservas/CeldaTurno';
import { ModalConfirmarReserva } from '@/componentes/reservas/ModalConfirmarReserva';
import { useAuth } from '@/hooks/useAuth';
import { useConectividad } from '@/hooks/useConectividad';
import { useCrearReserva, useDisponibilidad, useVentanaSieteDias } from '@/hooks/useDisponibilidad';
import { useEspacioDetalle } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { Turno } from '@/tipos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function DisponibilidadEspacioScreen() {
  const params = useLocalSearchParams<{ espacioId?: string; id?: string }>();
  const rawId = params.espacioId ?? params.id;
  const espacioId = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');

  const { paleta } = useTheme();
  const { usuario } = useAuth();
  const { conectado } = useConectividad();
  const diasVentana = useVentanaSieteDias();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    () => diasVentana[0]?.fechaISO ?? new Date().toISOString().split('T')[0]
  );
  const [turnoAConfirmar, setTurnoAConfirmar] = useState<Turno | null>(null);

  // Si los días se cargan o cambian, asegurar que la fecha esté asignada
  React.useEffect(() => {
    if (!fechaSeleccionada && diasVentana[0]?.fechaISO) {
      setFechaSeleccionada(diasVentana[0].fechaISO);
    }
  }, [diasVentana, fechaSeleccionada]);

  const { data: espacio } = useEspacioDetalle(espacioId);
  const {
    data: turnos,
    resumenDia,
    isLoading,
    isError,
    error,
    refetch,
  } = useDisponibilidad(espacioId, fechaSeleccionada);

  const { mutateAsync: crearReservaAsync } = useCrearReserva();

  if (isLoading) {
    return <EstadoCarga mensaje="Calculando turnos disponibles (08:00 a 24:00)..." />;
  }

  if (isError) {
    const infoError = extraerInfoErrorUI(
      error,
      'No se pudo consultar la disponibilidad del espacio.'
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

  const alConfirmarReserva = async (cantidadPersonas: number) => {
    if (!turnoAConfirmar) return;
    if (!conectado) {
      Alert.alert(
        'Sin conexión a internet',
        'Para reservar un turno nuevo necesitás conexión para sincronizar la grilla con el municipio y evitar superposiciones de horarios.'
      );
      return;
    }
    if (!usuario) {
      router.push(`/(auth)/login?redirigir=/(jugador)/disponibilidades/${espacioId}` as never);
      return;
    }

    const nueva = await crearReservaAsync({
      espacioId,
      turnoId: turnoAConfirmar.id,
      fechaISO: turnoAConfirmar.fecha,
      inicioHHMM: turnoAConfirmar.inicio,
      usuarioId: usuario.id,
      cantidadPersonas,
    });

    setTurnoAConfirmar(null);
    // Mando directo al detalle de la reserva con el QR
    router.push(`/(jugador)/reservas/${nueva.id}`);
  };

  return (
    <ThemedView style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        {espacio ? (
          <ThemedText style={[estilos.nombreEspacio, { color: paleta.primario }]}>
            {espacio.nombre}
          </ThemedText>
        ) : null}

        {/* Selector de los 7 días */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.barraDias}
        >
          {diasVentana.map((dia) => {
            const activo = dia.fechaISO === fechaSeleccionada;
            return (
              <Pressable
                key={dia.fechaISO}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => setFechaSeleccionada(dia.fechaISO)}
                style={[
                  estilos.chipDia,
                  {
                    backgroundColor: activo ? paleta.primario : paleta.superficie,
                    borderColor: activo ? paleta.primario : paleta.borde,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    estilos.chipDiaTexto,
                    { color: activo ? paleta.sobrePrimario : paleta.texto },
                  ]}
                >
                  {dia.etiquetaCorta}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Banners informativos del día */}
        {resumenDia.diaCompletoBloqueado ? (
          <View style={[estilos.alertaJornada, { backgroundColor: paleta.peligro }]}>
            <ThemedText style={estilos.alertaTexto}>
              Jornada suspendida: {resumenDia.motivoDiaCompleto}
            </ThemedText>
          </View>
        ) : resumenDia.sinTurnosLibres ? (
          <View style={[estilos.alertaJornada, { backgroundColor: paleta.acento }]}>
            <ThemedText style={estilos.alertaTexto}>
              Grilla completa para este día — 0 turnos libres disponibles.
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={[estilos.resumenTexto, { color: paleta.textoSecundario }]}>
            {resumenDia.libres} turnos libres de {resumenDia.total} franjas horarias (tocá uno para reservar)
          </ThemedText>
        )}
      </View>

      <FlatList
        data={turnos ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EstadoVacio
            icono="time-outline"
            titulo="Sin franjas generadas"
            descripcion="No hay horarios configurados para la fecha seleccionada."
          />
        }
        renderItem={({ item }) => (
          <CeldaTurno
            turno={item}
            alSeleccionar={(turno) => setTurnoAConfirmar(turno)}
          />
        )}
      />

      {/* Modal de Reserva Rápida en 2 Toques */}
      <ModalConfirmarReserva
        visible={Boolean(turnoAConfirmar)}
        turno={turnoAConfirmar}
        espacioNombre={espacio?.nombre ?? 'Cancha municipal'}
        complejo={espacio?.complejo ?? 'Polideportivo Municipal'}
        capacidadMaxima={espacio?.capacidad ?? 10}
        alConfirmar={alConfirmarReserva}
        alCerrar={() => setTurnoAConfirmar(null)}
      />
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  encabezado: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  nombreEspacio: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  barraDias: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  chipDia: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipDiaTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  resumenTexto: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 2,
  },
  alertaJornada: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertaTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lista: {
    padding: 16,
    paddingBottom: 32,
  },
});
