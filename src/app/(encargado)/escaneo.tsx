import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { useValidarQrPuerta } from '@/hooks/useAdminAgenda';
import { useAuth } from '@/hooks/useAuth';
import { useEspacios } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { ResultadoValidacionQr } from '@/tipos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function EscaneoQrScreen() {
  const { paleta } = useTheme();
  const { validarBiometria, hardwareBiometricoDisponible } = useAuth();
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [escaneadoPausado, setEscaneadoPausado] = useState(false);
  const [canchaFiltroId, setCanchaFiltroId] = useState<string>('');
  const [codigoManual, setCodigoManual] = useState('');

  const [resultadoExitoso, setResultadoExitoso] = useState<ResultadoValidacionQr | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const { data: espacios } = useEspacios();
  const { mutateAsync: validarQrAsync, isPending: validando } = useValidarQrPuerta();

  // Pedir desbloqueo biométrico al entrar si el dispositivo lo soporta
  useEffect(() => {
    let montado = true;
    async function chequearAcceso() {
      if (hardwareBiometricoDisponible) {
        const ok = await validarBiometria('Desbloquear escáner de portería');
        if (montado) setDesbloqueado(ok);
      } else {
        if (montado) setDesbloqueado(true);
      }
    }
    void chequearAcceso();
    return () => {
      montado = false;
    };
  }, [hardwareBiometricoDisponible, validarBiometria]);

  const procesarCodigoQr = async (codigoLeido: string) => {
    const limpio = codigoLeido.trim();
    if (!limpio || escaneadoPausado || validando) return;

    setEscaneadoPausado(true);

    try {
      const res = await validarQrAsync({
        codigoQr: limpio,
        espacioIdEsperado: canchaFiltroId || undefined,
      });

      // Vibración de éxito
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setResultadoExitoso(res);
      setErrorValidacion(null);
    } catch (err) {
      // Vibración de error
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const info = extraerInfoErrorUI(err, 'Código QR inválido o expirado.');
      setErrorValidacion(info.mensaje);
      setResultadoExitoso(null);
    }
  };

  const reanudarEscaneo = () => {
    setResultadoExitoso(null);
    setErrorValidacion(null);
    setCodigoManual('');
    setEscaneadoPausado(false);
  };

  // Si no pasó la biometría
  if (!desbloqueado) {
    return (
      <ThemedView style={estilos.centrado}>
        <Ionicons name="lock-closed-outline" size={56} color={paleta.primario} />
        <ThemedText style={[estilos.tituloBloqueo, { color: paleta.primario }]}>
          Portería Bloqueada
        </ThemedText>
        <ThemedText style={[estilos.subtituloBloqueo, { color: paleta.textoSecundario }]}>
          Se requiere autenticación para acceder al control de ingreso.
        </ThemedText>
        <Pressable
          style={[estilos.botonDesbloquear, { backgroundColor: paleta.primario }]}
          onPress={async () => {
            const ok = await validarBiometria('Desbloquear escáner de portería');
            if (ok) setDesbloqueado(true);
          }}
        >
          <Ionicons name="finger-print-outline" size={20} color={paleta.sobrePrimario} />
          <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
            Desbloquear con huella
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // Si no hay permisos de cámara
  if (!permiso?.granted && Platform.OS !== 'web') {
    return (
      <ThemedView style={estilos.centrado}>
        <Ionicons name="camera-outline" size={56} color={paleta.primario} />
        <ThemedText style={[estilos.tituloBloqueo, { color: paleta.primario }]}>
          Permiso de Cámara Requerido
        </ThemedText>
        <ThemedText style={[estilos.subtituloBloqueo, { color: paleta.textoSecundario }]}>
          Necesitamos acceso a la cámara para escanear los códigos QR de las reservas.
        </ThemedText>
        <Pressable
          style={[estilos.botonDesbloquear, { backgroundColor: paleta.primario }]}
          onPress={pedirPermiso}
        >
          <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
            Habilitar cámara
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={estilos.contenedor}>
      {/* Selector de cancha a controlar */}
      <View style={[estilos.barraCancha, { backgroundColor: paleta.superficie }]}>
        <Ionicons name="filter-outline" size={16} color={paleta.textoSecundario} />
        <ThemedText style={[estilos.canchaLabel, { color: paleta.textoSecundario }]}>
          Cancha:
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCanchas}>
          <Pressable
            onPress={() => setCanchaFiltroId('')}
            style={[
              estilos.chipCancha,
              {
                backgroundColor: !canchaFiltroId ? paleta.primario : paleta.fondo,
              },
            ]}
          >
            <ThemedText
              style={[
                estilos.chipCanchaTexto,
                { color: !canchaFiltroId ? paleta.sobrePrimario : paleta.texto },
              ]}
            >
              Todas
            </ThemedText>
          </Pressable>
          {(espacios ?? []).map((esp) => {
            const activo = canchaFiltroId === esp.id;
            return (
              <Pressable
                key={esp.id}
                onPress={() => setCanchaFiltroId(esp.id)}
                style={[
                  estilos.chipCancha,
                  {
                    backgroundColor: activo ? paleta.primario : paleta.fondo,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    estilos.chipCanchaTexto,
                    { color: activo ? paleta.sobrePrimario : paleta.texto },
                  ]}
                >
                  {esp.nombre}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Cámara o Fallback en Web */}
      {Platform.OS !== 'web' ? (
        <View style={estilos.contenedorCamara}>
          <CameraView
            style={StyleSheet.absoluteFill}
            enableTorch={linterna}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={
              escaneadoPausado ? undefined : ({ data }) => void procesarCodigoQr(data)
            }
          />

          <View style={estilos.mascara}>
            <View style={estilos.mascaraArriba} />
            <View style={estilos.filaCentral}>
              <View style={estilos.mascaraLateral} />
              <View style={estilos.cuadroEnfoque}>
                <View style={[estilos.esquina, estilos.esquinaTL]} />
                <View style={[estilos.esquina, estilos.esquinaTR]} />
                <View style={[estilos.esquina, estilos.esquinaBL]} />
                <View style={[estilos.esquina, estilos.esquinaBR]} />

                {validando ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : null}
              </View>
              <View style={estilos.mascaraLateral} />
            </View>
            <View style={estilos.mascaraAbajo}>
              <ThemedText style={estilos.textoInstruccion}>
                Apuntá al código QR del jugador
              </ThemedText>
            </View>
          </View>

          {/* Bot´´on linterna */}
          <Pressable
            style={[
              estilos.botonLinterna,
              { backgroundColor: linterna ? '#FBC02D' : 'rgba(0,0,0,0.6)' },
            ]}
            onPress={() => setLinterna((prev) => !prev)}
          >
            <Ionicons
              name={linterna ? 'flashlight' : 'flashlight-outline'}
              size={22}
              color={linterna ? '#000000' : '#FFFFFF'}
            />
          </Pressable>
        </View>
      ) : (
        <ThemedView style={estilos.simuladorWeb}>
          <Ionicons name="qr-code-outline" size={48} color={paleta.primario} />
          <ThemedText style={[estilos.tituloWeb, { color: paleta.primario }]}>
            Simulador de Escáner QR (Web)
          </ThemedText>
          <ThemedText style={[estilos.subtituloWeb, { color: paleta.textoSecundario }]}>
            Ingresá el código QR manualmente o seleccioná un turno de prueba para verificarlo:
          </ThemedText>

          <View style={estilos.filaInputManual}>
            <TextInput
              style={[
                estilos.inputManual,
                { backgroundColor: paleta.superficie, color: paleta.texto, borderColor: paleta.borde },
              ]}
              placeholder="Ej: VGY-1200-ESP-01-20261104-19"
              placeholderTextColor={paleta.textoSecundario}
              value={codigoManual}
              onChangeText={setCodigoManual}
            />
            <Pressable
              style={[estilos.botonValidarManual, { backgroundColor: paleta.primario }]}
              onPress={() => void procesarCodigoQr(codigoManual)}
              disabled={validando || !codigoManual.trim()}
            >
              <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
                {validando ? 'Validando...' : 'Escanear'}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      )}

      <Modal visible={Boolean(resultadoExitoso)} transparent animationType="fade">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaResultado, { backgroundColor: paleta.superficie }]}>
            <View style={[estilos.iconoCirculo, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={44} color="#2E7D32" />
            </View>

            <ThemedText style={[estilos.tituloResultado, { color: '#2E7D32' }]}>
              ¡Ingreso Acreditado!
            </ThemedText>

            <View style={estilos.datosReserva}>
              <View style={estilos.filaDato}>
                <ThemedText style={estilos.datoEtiqueta}>Jugador:</ThemedText>
                <ThemedText style={estilos.datoValor}>
                  {resultadoExitoso?.jugadorNombre}
                </ThemedText>
              </View>

              <View style={estilos.filaDato}>
                <ThemedText style={estilos.datoEtiqueta}>Cancha:</ThemedText>
                <ThemedText style={estilos.datoValor}>
                  {resultadoExitoso?.espacioNombre}
                </ThemedText>
              </View>

              <View style={estilos.filaDato}>
                <ThemedText style={estilos.datoEtiqueta}>Horario:</ThemedText>
                <ThemedText style={estilos.datoValor}>
                  {resultadoExitoso?.inicio} a {resultadoExitoso?.fin} hs
                </ThemedText>
              </View>

              <View style={estilos.filaDato}>
                <ThemedText style={estilos.datoEtiqueta}>Personas:</ThemedText>
                <ThemedText style={estilos.datoValor}>
                  {resultadoExitoso?.reserva.cantidadPersonas} jugadores
                </ThemedText>
              </View>
            </View>

            <Pressable
              style={[estilos.botonContinuar, { backgroundColor: paleta.primario }]}
              onPress={reanudarEscaneo}
            >
              <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
                Siguiente ingreso
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(errorValidacion)} transparent animationType="fade">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaResultado, { backgroundColor: paleta.superficie }]}>
            <View style={[estilos.iconoCirculo, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="close-circle" size={44} color="#C62828" />
            </View>

            <ThemedText style={[estilos.tituloResultado, { color: '#C62828' }]}>
              Ingreso Rechazado
            </ThemedText>

            <ThemedText style={[estilos.mensajeError, { color: paleta.texto }]}>
              {errorValidacion}
            </ThemedText>

            <Pressable
              style={[estilos.botonContinuar, { backgroundColor: paleta.primario }]}
              onPress={reanudarEscaneo}
            >
              <ThemedText style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
                Reintentar
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tituloBloqueo: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  subtituloBloqueo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  botonDesbloquear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  barraCancha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    zIndex: 10,
  },
  canchaLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollCanchas: {
    gap: 6,
    paddingRight: 12,
  },
  chipCancha: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipCanchaTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  contenedorCamara: {
    flex: 1,
    position: 'relative',
  },
  mascara: {
    flex: 1,
  },
  mascaraArriba: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  filaCentral: {
    flexDirection: 'row',
    height: 250,
  },
  mascaraLateral: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cuadroEnfoque: {
    width: 250,
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  esquina: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#4ADE80',
  },
  esquinaTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  esquinaTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  esquinaBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  esquinaBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  mascaraAbajo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 20,
  },
  textoInstruccion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  botonLinterna: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simuladorWeb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  tituloWeb: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtituloWeb: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 400,
  },
  filaInputManual: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 440,
    marginTop: 8,
  },
  inputManual: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  botonValidarManual: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telonModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tarjetaResultado: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconoCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tituloResultado: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  datosReserva: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datoEtiqueta: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  datoValor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  mensajeError: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  botonContinuar: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonTexto: {
    fontWeight: '700',
    fontSize: 14,
  },
});
