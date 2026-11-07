import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoError } from '@/componentes/comun/EstadoError';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { BadgeEstadoReserva } from '@/componentes/reservas/BadgeEstadoReserva';
import { ModalCancelarReserva } from '@/componentes/reservas/ModalCancelarReserva';
import { useCancelarReserva, useReservaDetalle } from '@/hooks/useReservas';
import { useTheme } from '@/hooks/useTheme';
import { evaluarVentanaCancelacion } from '@/utils/calculoTurnos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function DetalleReservaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { paleta } = useTheme();
  const { data: reserva, isLoading, isError, error, refetch } = useReservaDetalle(id);
  const { mutateAsync: cancelarAsync, isPending: cancelando } = useCancelarReserva();

  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState<string | null>(null);

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando datos y código QR offline..." />;
  }

  if (isError || !reserva) {
    const info = extraerInfoErrorUI(error, 'No se pudo cargar el detalle del turno.');
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

  const ventanaCancelacion = evaluarVentanaCancelacion(reserva.cancelableHasta);

  // Formatear fecha para el usuario tipo DD/MM/AAAA
  const fechaPartes = reserva.fechaISO.split('-');
  const fechaAmigable =
    fechaPartes.length === 3
      ? `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]}`
      : reserva.fechaISO;

  const alConfirmarCancelacion = async () => {
    try {
      const res = await cancelarAsync(reserva.id);
      setMostrarModalCancelacion(false);

      if (res.fueCancelacionTardia) {
        setMensajeCancelacion(
          'Reserva cancelada. Al realizarse con menos de 4 horas de aviso, se computó como cancelación tardía.'
        );
      } else {
        setMensajeCancelacion('Reserva cancelada correctamente sin penalizaciones.');
      }
    } catch (err) {
      const errInfo = extraerInfoErrorUI(err, 'No se pudo cancelar la reserva.');
      Alert.alert('Error', errInfo.mensaje);
    }
  };

  const abrirEnGoogleMaps = () => {
    const lat = reserva.coordenadas.latitud;
    const lng = reserva.coordenadas.longitud;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    void Linking.openURL(url);
  };

  return (
    <ThemedView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenedor}>
        {/* Cabecera de la Reserva */}
        <View style={estilos.cabecera}>
          <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
            {reserva.espacioNombre}
          </ThemedText>
          <ThemedText style={[estilos.complejo, { color: paleta.textoSecundario }]}>
            {reserva.complejo}
          </ThemedText>
          <View style={estilos.filaEstado}>
            <BadgeEstadoReserva estado={reserva.estado} />
            <ThemedText style={[estilos.idReserva, { color: paleta.textoSecundario }]}>
              #{reserva.id}
            </ThemedText>
          </View>
        </View>

        {/* Tarjeta del Código QR offline */}
        <View
          style={[
            estilos.tarjetaQr,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          {reserva.estado === 'confirmada' ? (
            <>
              <View style={estilos.marcoQr}>
                <QRCode
                  value={reserva.codigoQr}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#1A202C"
                />
              </View>

              <ThemedText style={[estilos.codigoQrTexto, { color: paleta.primario }]}>
                {reserva.codigoQr}
              </ThemedText>

              <ThemedText style={[estilos.instruccionQr, { color: paleta.texto }]}>
                Mostráselo al encargado al llegar al complejo
              </ThemedText>

              <View style={[estilos.badgeOffline, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                <ThemedText style={estilos.textoBadgeOffline}>
                  Guardado en SQLite — Funciona sin internet
                </ThemedText>
              </View>
            </>
          ) : (
            <View style={estilos.qrDeshabilitado}>
              <Ionicons
                name={reserva.estado === 'cumplida' ? 'checkmark-circle' : 'close-circle'}
                size={56}
                color={reserva.estado === 'cumplida' ? paleta.exito : paleta.peligro}
              />
              <ThemedText style={estilos.tituloEstadoFinal}>
                {reserva.estado === 'cumplida'
                  ? 'Turno Cumplido'
                  : reserva.estado === 'ausente'
                    ? 'Ausencia Registrada'
                    : 'Turno Cancelado'}
              </ThemedText>
              <ThemedText style={[estilos.detalleEstadoFinal, { color: paleta.textoSecundario }]}>
                {reserva.ingresoEn
                  ? `Ingreso verificado: ${reserva.ingresoEn.slice(11, 16)} hs.`
                  : 'Este código QR ya no es válido para ingreso en puerta.'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Ficha informativa del Turno */}
        <View
          style={[
            estilos.bloqueInfo,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          <ThemedText style={[estilos.subtituloInfo, { color: paleta.primario }]}>
            Información del turno
          </ThemedText>

          <View style={estilos.filaDato}>
            <ThemedText style={[estilos.etiquetaDato, { color: paleta.textoSecundario }]}>
              Fecha:
            </ThemedText>
            <ThemedText style={estilos.valorDato}>Día {fechaAmigable}</ThemedText>
          </View>

          <View style={estilos.filaDato}>
            <ThemedText style={[estilos.etiquetaDato, { color: paleta.textoSecundario }]}>
              Horario:
            </ThemedText>
            <ThemedText style={estilos.valorDato}>
              {reserva.inicio} a {reserva.fin} hs
            </ThemedText>
          </View>

          <View style={estilos.filaDato}>
            <ThemedText style={[estilos.etiquetaDato, { color: paleta.textoSecundario }]}>
              Jugadores:
            </ThemedText>
            <ThemedText style={estilos.valorDato}>{reserva.cantidadPersonas} personas</ThemedText>
          </View>

          <View style={[estilos.filaDato, estilos.filaPrecio]}>
            <ThemedText style={[estilos.etiquetaDato, { color: paleta.textoSecundario }]}>
              Abono en puerta:
            </ThemedText>
            <ThemedText style={[estilos.valorDato, { color: paleta.exito, fontWeight: '700' }]}>
              ${reserva.precioPorHora.toLocaleString('es-AR')} (se paga en el lugar)
            </ThemedText>
          </View>

          {/* Botón Cómo Llegar con Google Maps */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cómo llegar al complejo en Google Maps"
            style={[estilos.btnUbicacion, { borderColor: paleta.primario }]}
            onPress={abrirEnGoogleMaps}
          >
            <Ionicons name="navigate-circle-outline" size={20} color={paleta.primario} />
            <ThemedText style={[estilos.btnUbicacionTexto, { color: paleta.primario }]}>
              Cómo llegar al complejo (Google Maps)
            </ThemedText>
          </Pressable>
        </View>

        {/* Mensaje de cancelación exitosa */}
        {mensajeCancelacion ? (
          <View style={[estilos.alertaCancelacion, { backgroundColor: paleta.superficie }]}>
            <Ionicons name="information-circle-outline" size={20} color={paleta.acento} />
            <ThemedText style={estilos.textoAlertaCancelacion}>{mensajeCancelacion}</ThemedText>
          </View>
        ) : null}

        {/* Botón de Cancelación */}
        {reserva.estado === 'confirmada' && reserva.esFuturaOVigente ? (
          <View style={estilos.seccionCancelacion}>
            <ThemedText style={[estilos.avisoCancelacion, { color: paleta.textoSecundario }]}>
              {ventanaCancelacion.sinAviso
                ? `Cancelación sin penalización disponible hasta las ${ventanaCancelacion.horaLimiteTexto} hs (4 horas antes).`
                : 'Atención: faltan menos de 4 horas. Si cancelás ahora, se registrará cancelación tardía.'}
            </ThemedText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar este turno"
              style={[estilos.botonCancelar, { borderColor: paleta.peligro }]}
              onPress={() => setMostrarModalCancelacion(true)}
              disabled={cancelando}
            >
              <Ionicons name="trash-outline" size={18} color={paleta.peligro} />
              <ThemedText style={[estilos.botonCancelarTexto, { color: paleta.peligro }]}>
                {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal accesible de cancelación */}
      <ModalCancelarReserva
        visible={mostrarModalCancelacion}
        enProceso={cancelando}
        canchaNombre={reserva.espacioNombre}
        horarioTexto={`Día ${fechaAmigable} (${reserva.inicio} a ${reserva.fin} hs)`}
        ventana={ventanaCancelacion}
        alConfirmar={() => void alConfirmarCancelacion()}
        alCerrar={() => setMostrarModalCancelacion(false)}
      />
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenedor: {
    padding: 18,
  },
  cabecera: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
  },
  complejo: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idReserva: {
    fontSize: 13,
  },
  tarjetaQr: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  marcoQr: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  codigoQrTexto: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  instruccionQr: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  textoBadgeOffline: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  qrDeshabilitado: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  tituloEstadoFinal: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  detalleEstadoFinal: {
    fontSize: 13,
    textAlign: 'center',
  },
  bloqueInfo: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
  },
  subtituloInfo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filaPrecio: {
    borderBottomWidth: 0,
    paddingTop: 10,
  },
  etiquetaDato: {
    fontSize: 14,
  },
  valorDato: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  btnUbicacionTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertaCancelacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0288D1',
  },
  textoAlertaCancelacion: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  seccionCancelacion: {
    marginTop: 4,
    marginBottom: 30,
    alignItems: 'center',
  },
  avisoCancelacion: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  botonCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    width: '100%',
  },
  botonCancelarTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
});
