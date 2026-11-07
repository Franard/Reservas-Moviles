import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useTheme } from '@/hooks/useTheme';

export interface ModalBiometriaProps {
  visible: boolean;
  titulo?: string;
  mensaje?: string;
  alConfirmar: () => void;
  alCancelar: () => void;
  alUsarClave?: () => void;
}

export function ModalBiometria({
  visible,
  titulo = 'Verificación Biométrica',
  mensaje = 'Apoyá tu huella o usá el reconocimiento facial para ingresar.',
  alConfirmar,
  alCancelar,
  alUsarClave,
}: ModalBiometriaProps) {
  const { paleta } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={alCancelar}
      accessibilityRole="none"
    >
      <View style={estilos.telonFondo}>
        <View
          style={[
            estilos.tarjeta,
            { backgroundColor: paleta.superficie, borderColor: paleta.borde },
          ]}
          accessibilityViewIsModal={true}
          accessibilityLabel={titulo}
        >
          <View
            style={[
              estilos.circuloIcono,
              { backgroundColor: paleta.fondo, borderColor: paleta.primario },
            ]}
          >
            <Ionicons name="finger-print-outline" size={44} color={paleta.primario} />
          </View>

          <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>{titulo}</ThemedText>

          <ThemedText style={[estilos.mensaje, { color: paleta.textoSecundario }]}>
            {mensaje}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verificar huella o rostro"
            style={({ pressed }) => [
              estilos.botonPrimario,
              { backgroundColor: paleta.primario, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={alConfirmar}
          >
            <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
              Identificarme ahora
            </ThemedText>
          </Pressable>

          {alUsarClave ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ingresar con contraseña manual"
              style={estilos.botonSecundario}
              onPress={alUsarClave}
            >
              <ThemedText style={[estilos.botonSecundarioTexto, { color: paleta.acento }]}>
                Usar contraseña / PIN
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar autenticación"
            style={estilos.botonCancelar}
            onPress={alCancelar}
          >
            <ThemedText style={[estilos.botonCancelarTexto, { color: paleta.textoSecundario }]}>
              Cancelar
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  circuloIcono: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  botonPrimario: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '700',
  },
  botonSecundario: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  botonSecundarioTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  botonCancelar: {
    paddingVertical: 6,
  },
  botonCancelarTexto: {
    fontSize: 13,
  },
});
