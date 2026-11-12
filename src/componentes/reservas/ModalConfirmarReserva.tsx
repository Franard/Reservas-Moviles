import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useAuth } from '@/hooks/useAuth';
import { useConectividad } from '@/hooks/useConectividad';
import { useTheme } from '@/hooks/useTheme';
import type { Turno } from '@/tipos';

export interface ModalConfirmarReservaProps {
  visible: boolean;
  turno: Turno | null;
  espacioNombre: string;
  complejo: string;
  capacidadMaxima: number;
  alConfirmar: (cantidadPersonas: number) => Promise<void>;
  alCerrar: () => void;
}

export function ModalConfirmarReserva({
  visible,
  turno,
  espacioNombre,
  complejo,
  capacidadMaxima,
  alConfirmar,
  alCerrar,
}: ModalConfirmarReservaProps) {
  const { paleta } = useTheme();
  const { usuario } = useAuth();
  const { conectado } = useConectividad();
  const [cantidad, setCantidad] = useState<number>(() =>
    Math.min(capacidadMaxima, 10)
  );
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (!turno) return null;

  const decrementar = () => {
    if (cantidad > 1) {
      void Haptics.selectionAsync();
      setCantidad((c) => c - 1);
    }
  };

  const incrementar = () => {
    if (cantidad < capacidadMaxima) {
      void Haptics.selectionAsync();
      setCantidad((c) => c + 1);
    }
  };

  const confirmar = async () => {
    if (!conectado) {
      setErrorLocal(
        'Modo sin conexión: se requiere internet para sincronizar la grilla y evitar superposiciones.'
      );
      return;
    }
    setErrorLocal(null);
    setEnviando(true);
    try {
      await alConfirmar(cantidad);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof Error ? err.message : 'No se pudo crear la reserva.';
      setErrorLocal(msg);
    } finally {
      setEnviando(false);
    }
  };

  const irALogin = () => {
    alCerrar();
    router.push(
      `/(auth)/login?redirigir=/(jugador)/disponibilidades/${turno.espacioId}` as never
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={alCerrar}
    >
      <View style={estilos.telonFondo}>
        <View
          style={[
            estilos.tarjeta,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.filaTitulo}>
              <Ionicons name="flash" size={20} color={paleta.acento} />
              <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
                Reserva rápida (2 toques)
              </ThemedText>
            </View>
            <Pressable onPress={alCerrar} style={estilos.botonCerrar}>
              <Ionicons name="close" size={22} color={paleta.textoSecundario} />
            </Pressable>
          </View>

          <View
            style={[
              estilos.cajaResumen,
              { backgroundColor: paleta.fondo, borderColor: paleta.borde },
            ]}
          >
            <ThemedText style={[estilos.nombreCancha, { color: paleta.primario }]}>
              {espacioNombre}
            </ThemedText>
            <ThemedText style={[estilos.complejoTexto, { color: paleta.textoSecundario }]}>
              {complejo}
            </ThemedText>

            <View style={estilos.filaDetalles}>
              <View style={estilos.itemDetalle}>
                <Ionicons name="calendar-outline" size={16} color={paleta.primario} />
                <ThemedText style={estilos.itemDetalleTexto}>{turno.fecha}</ThemedText>
              </View>
              <View style={estilos.itemDetalle}>
                <Ionicons name="time-outline" size={16} color={paleta.primario} />
                <ThemedText style={estilos.itemDetalleTexto}>
                  {turno.inicio} a {turno.fin} hs
                </ThemedText>
              </View>
            </View>

            <View style={estilos.filaPrecio}>
              <ThemedText style={[estilos.precioEtiqueta, { color: paleta.textoSecundario }]}>
                Total a abonar en puerta:
              </ThemedText>
              <ThemedText style={[estilos.precioValor, { color: paleta.exito }]}>
                ${(turno.precio ?? 0).toLocaleString('es-AR')}
              </ThemedText>
            </View>
          </View>

          <View style={estilos.seccionJugadores}>
            <ThemedText style={estilos.etiquetaJugadores}>
              Cantidad de personas en cancha:
            </ThemedText>
            <View style={estilos.contadorFila}>
              <Pressable
                style={[
                  estilos.botonContador,
                  { backgroundColor: paleta.fondo, borderColor: paleta.borde },
                  cantidad <= 1 && estilos.botonContadorDeshabilitado,
                ]}
                onPress={decrementar}
                disabled={cantidad <= 1 || enviando}
              >
                <Ionicons name="remove" size={20} color={paleta.primario} />
              </Pressable>

              <ThemedText style={[estilos.numeroJugadores, { color: paleta.primario }]}>
                {cantidad} jugadores
              </ThemedText>

              <Pressable
                style={[
                  estilos.botonContador,
                  { backgroundColor: paleta.fondo, borderColor: paleta.borde },
                  cantidad >= capacidadMaxima && estilos.botonContadorDeshabilitado,
                ]}
                onPress={incrementar}
                disabled={cantidad >= capacidadMaxima || enviando}
              >
                <Ionicons name="add" size={20} color={paleta.primario} />
              </Pressable>
            </View>
            <ThemedText style={[estilos.capacidadMaxTexto, { color: paleta.textoSecundario }]}>
              Capacidad máxima permitida: {capacidadMaxima} personas
            </ThemedText>
          </View>

          {!conectado ? (
            <View style={estilos.alertaOffline}>
              <Ionicons name="cloud-offline-outline" size={16} color="#B71C1C" />
              <ThemedText style={estilos.textoAlertaOffline}>
                Modo sin conexión: se requiere internet para confirmar turnos y evitar superposiciones con otros vecinos.
              </ThemedText>
            </View>
          ) : null}

          {/* Error si ocurrió */}
          {errorLocal ? (
            <View style={estilos.alertaError}>
              <Ionicons name="alert-circle" size={16} color="#B71C1C" />
              <ThemedText style={estilos.textoAlertaError}>{errorLocal}</ThemedText>
            </View>
          ) : null}

          {/* Botón de Confirmación o Acceso para Invitados */}
          {usuario ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar reserva del turno"
              style={[
                estilos.botonConfirmar,
                {
                  backgroundColor: !conectado ? '#9E9E9E' : paleta.primario,
                  opacity: enviando || !conectado ? 0.8 : 1,
                },
              ]}
              onPress={confirmar}
              disabled={enviando || !conectado}
            >
              {enviando ? (
                <ActivityIndicator size="small" color={paleta.sobrePrimario} />
              ) : (
                <>
                  <Ionicons
                    name={conectado ? 'checkmark-circle' : 'cloud-offline-outline'}
                    size={20}
                    color={paleta.sobrePrimario}
                  />
                  <ThemedText style={[estilos.botonConfirmarTexto, { color: paleta.sobrePrimario }]}>
                    {conectado ? 'Confirmar Reserva' : 'Requiere Conexión'}
                  </ThemedText>
                </>
              )}
            </Pressable>
          ) : (
            <View style={estilos.seccionInvitado}>
              <ThemedText style={[estilos.avisoInvitado, { color: paleta.textoSecundario }]}>
                Para registrar el turno a tu nombre y generar el código QR offline, necesitás ingresar.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión para reservar"
                style={[estilos.botonConfirmar, { backgroundColor: paleta.primario }]}
                onPress={irALogin}
              >
                <Ionicons name="log-in-outline" size={20} color={paleta.sobrePrimario} />
                <ThemedText style={[estilos.botonConfirmarTexto, { color: paleta.sobrePrimario }]}>
                  Iniciar Sesión para Reservar
                </ThemedText>
              </Pressable>
            </View>
          )}

          <Pressable style={estilos.botonCancelarModal} onPress={alCerrar} disabled={enviando}>
            <ThemedText style={[estilos.textoCancelarModal, { color: paleta.textoSecundario }]}>
              Volver a la grilla
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  telonFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  tarjeta: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
  },
  botonCerrar: {
    padding: 4,
  },
  cajaResumen: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  nombreCancha: {
    fontSize: 16,
    fontWeight: '700',
  },
  complejoTexto: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  filaDetalles: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  itemDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  itemDetalleTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    marginTop: 4,
  },
  precioEtiqueta: {
    fontSize: 13,
  },
  precioValor: {
    fontSize: 17,
    fontWeight: '800',
  },
  seccionJugadores: {
    marginBottom: 16,
  },
  etiquetaJugadores: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  contadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  botonContador: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonContadorDeshabilitado: {
    opacity: 0.35,
  },
  numeroJugadores: {
    fontSize: 16,
    fontWeight: '700',
  },
  capacidadMaxTexto: {
    fontSize: 12,
    textAlign: 'center',
  },
  alertaOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  textoAlertaOffline: {
    color: '#B71C1C',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  textoAlertaError: {
    color: '#B71C1C',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  botonConfirmarTexto: {
    fontSize: 15,
    fontWeight: '700',
  },
  seccionInvitado: {
    gap: 10,
    marginBottom: 6,
  },
  avisoInvitado: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  botonCancelarModal: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoCancelarModal: {
    fontSize: 14,
    fontWeight: '600',
  },
});
