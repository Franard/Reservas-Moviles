import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { VentanaCancelacionInfo } from '@/tipos';

export interface ModalCancelarReservaProps {
  visible: boolean;
  enProceso: boolean;
  canchaNombre: string;
  horarioTexto: string;
  ventana: VentanaCancelacionInfo;
  alConfirmar: () => void;
  alCerrar: () => void;
}

export function ModalCancelarReserva({
  visible,
  enProceso,
  canchaNombre,
  horarioTexto,
  ventana,
  alConfirmar,
  alCerrar,
}: ModalCancelarReservaProps) {
  const { paleta } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={alCerrar}
    >
      <View style={estilos.telon}>
        <View
          style={[
            estilos.tarjeta,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
        >
          <View style={estilos.encabezado}>
            <View
              style={[
                estilos.iconoCirculo,
                { backgroundColor: ventana.sinAviso ? '#E8F5E9' : '#FFF3E0' },
              ]}
            >
              <Ionicons
                name={ventana.sinAviso ? 'calendar-outline' : 'warning-outline'}
                size={28}
                color={ventana.sinAviso ? '#2E7D32' : '#E65100'}
              />
            </View>
            <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
              {ventana.sinAviso ? 'Cancelar Turno' : 'Cancelación Tardía'}
            </ThemedText>
          </View>

          <ThemedText style={[estilos.resumenCancha, { color: paleta.texto }]}>
            {canchaNombre} — {horarioTexto}
          </ThemedText>

          <View
            style={[
              estilos.cajaExplicacion,
              {
                backgroundColor: ventana.sinAviso ? '#F1F8E9' : '#FFF8E1',
                borderColor: ventana.sinAviso ? '#C8E6C9' : '#FFE082',
              },
            ]}
          >
            <ThemedText style={estilos.textoExplicacion}>
              {ventana.sinAviso
                ? `Estás cancelando con más de 4 horas de anticipación. El turno se liberará de inmediato para otro vecino y no se registrará ninguna penalización en tu cuenta municipal.`
                : `Faltan menos de 4 horas para el inicio del turno. Si cancelás ahora, el turno se liberará pero se registrará una CANCELACIÓN TARDÍA en tu perfil municipal.`}
            </ThemedText>
          </View>

          <View style={estilos.acciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sí, confirmar cancelación"
              style={[
                estilos.btnConfirmar,
                { backgroundColor: paleta.peligro },
                enProceso && { opacity: 0.6 },
              ]}
              onPress={alConfirmar}
              disabled={enProceso}
            >
              {enProceso ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={estilos.btnConfirmarTexto}>
                    Sí, cancelar reserva
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mantener mi turno"
              style={estilos.btnVolver}
              onPress={alCerrar}
              disabled={enProceso}
            >
              <ThemedText style={[estilos.btnVolverTexto, { color: paleta.textoSecundario }]}>
                No, mantener mi turno
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  telon: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconoCirculo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  resumenCancha: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  cajaExplicacion: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  textoExplicacion: {
    fontSize: 13,
    lineHeight: 18,
    color: '#37474F',
    textAlign: 'center',
  },
  acciones: {
    gap: 10,
  },
  btnConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnVolver: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnVolverTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
});
