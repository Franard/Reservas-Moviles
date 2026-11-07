import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoVacio } from '@/componentes/comun/EstadoVacio';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import {
  useAgendaDia,
  useMarcarAusencia,
  useRegistrarIngresoManual,
} from '@/hooks/useAdminAgenda';
import { useComplejosDisponibles } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { ItemAgendaEncargado } from '@/tipos';
import {
  formatearFechaISOLocal,
  generarVentanaSieteDias,
} from '@/utils/calculoTurnos';

export default function AgendaEncargadoScreen() {
  const { paleta } = useTheme();
  const diasVentana = useMemo(() => generarVentanaSieteDias(new Date()), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    () => diasVentana[0]?.fechaISO ?? formatearFechaISOLocal(new Date())
  );
  const complejos = useComplejosDisponibles();
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<string | null>(null);
  const [soloReservas, setSoloReservas] = useState(false);

  // Modal para confirmar ausencia
  const [turnoParaAusente, setTurnoParaAusente] = useState<ItemAgendaEncargado | null>(null);

  // Reporte fotográfico de la cancha
  const [reportesFotos, setReportesFotos] = useState<Record<string, string>>({});

  const filtros = useMemo(
    () => ({
      complejo: complejoSeleccionado,
      soloReservas,
    }),
    [complejoSeleccionado, soloReservas]
  );

  const {
    data: agenda,
    isLoading,
    refetch,
    isRefetching,
  } = useAgendaDia(fechaSeleccionada, filtros);

  const { mutateAsync: marcarAusenciaAsync, isPending: marcandoAusencia } = useMarcarAusencia();
  const { mutateAsync: ingresoManualAsync, isPending: marcandoIngreso } = useRegistrarIngresoManual();

  // Tomar foto con la cámara y guardarla en el dispositivo
  const tomarFotoEstadoCancha = async (item: ItemAgendaEncargado) => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          'Se necesita permiso de cámara para sacar fotos del estado de la cancha.'
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        const uriOriginal = res.assets[0].uri;
        let uriFinal = uriOriginal;

        if (Platform.OS !== 'web') {
          try {
            const nombre = `reporte_${item.turno.espacioId}_${Date.now()}.jpg`;
            const archivoOrigen = new File(uriOriginal);
            const archivoDestino = new File(Paths.document, nombre);
            archivoOrigen.copy(archivoDestino);
            uriFinal = archivoDestino.uri;
          } catch {
            uriFinal = uriOriginal;
          }
        }

        setReportesFotos((prev) => ({
          ...prev,
          [item.turno.id]: uriFinal,
        }));
      }
    } catch (e) {
      console.warn('Error al capturar foto de cancha:', e);
    }
  };

  const confirmarMarcarAusente = async () => {
    if (!turnoParaAusente?.reserva) return;
    try {
      await marcarAusenciaAsync(turnoParaAusente.reserva.id);
      setTurnoParaAusente(null);
    } catch (e) {
      console.warn('Error al marcar ausencia:', e);
    }
  };

  const acreditarIngresoManual = async (reservaId: string) => {
    try {
      await ingresoManualAsync(reservaId);
    } catch (e) {
      console.warn('Error al acreditar ingreso:', e);
    }
  };

  // Contadores para resumen rápido
  const conteo = useMemo(() => {
    let confirmadas = 0;
    let presentes = 0;
    let ausentes = 0;
    (agenda ?? []).forEach((i) => {
      if (i.estadoReserva === 'confirmada') confirmadas++;
      if (i.estadoReserva === 'cumplida') presentes++;
      if (i.estadoReserva === 'ausente') ausentes++;
    });
    return { confirmadas, presentes, ausentes };
  }, [agenda]);

  return (
    <ThemedView style={estilos.contenedor}>
      {/* Selector de días */}
      <View style={[estilos.seccionDias, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollDias}>
          {diasVentana.map((d) => {
            const activo = d.fechaISO === fechaSeleccionada;
            return (
              <Pressable
                key={d.fechaISO}
                onPress={() => setFechaSeleccionada(d.fechaISO)}
                style={[
                  estilos.chipDia,
                  {
                    backgroundColor: activo ? paleta.primario : paleta.fondo,
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
                  {d.etiquetaCorta}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Filtros por Complejo y Switch Solo Reservas */}
      <View style={[estilos.seccionFiltros, { backgroundColor: paleta.superficie }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollFiltros}>
          <Pressable
            onPress={() => setComplejoSeleccionado(null)}
            style={[
              estilos.chipFiltro,
              {
                backgroundColor: complejoSeleccionado === null ? paleta.acento : paleta.fondo,
              },
            ]}
          >
            <ThemedText
              style={[
                estilos.chipFiltroTexto,
                { color: complejoSeleccionado === null ? '#FFFFFF' : paleta.textoSecundario },
              ]}
            >
              Todos los complejos
            </ThemedText>
          </Pressable>

          {complejos.map((comp) => {
            const activo = complejoSeleccionado === comp;
            return (
              <Pressable
                key={comp}
                onPress={() => setComplejoSeleccionado(activo ? null : comp)}
                style={[
                  estilos.chipFiltro,
                  { backgroundColor: activo ? paleta.acento : paleta.fondo },
                ]}
              >
                <ThemedText
                  style={[
                    estilos.chipFiltroTexto,
                    { color: activo ? '#FFFFFF' : paleta.textoSecundario },
                  ]}
                >
                  {comp}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={[
            estilos.botonSoloReservas,
            {
              backgroundColor: soloReservas ? paleta.primario : paleta.fondo,
              borderColor: soloReservas ? paleta.primario : paleta.borde,
            },
          ]}
          onPress={() => setSoloReservas((prev) => !prev)}
        >
          <Ionicons
            name={soloReservas ? 'checkbox' : 'square-outline'}
            size={16}
            color={soloReservas ? paleta.sobrePrimario : paleta.textoSecundario}
          />
          <ThemedText
            style={[
              estilos.textoSoloReservas,
              { color: soloReservas ? paleta.sobrePrimario : paleta.texto },
            ]}
          >
            Solo con reserva
          </ThemedText>
        </Pressable>
      </View>

      {/* Resumen rápido de portería */}
      <View style={[estilos.barraResumen, { backgroundColor: paleta.fondo }]}>
        <ThemedText style={estilos.resumenItem}>
          🟡 <ThemedText style={estilos.resumenNegrita}>{conteo.confirmadas}</ThemedText> pendientes
        </ThemedText>
        <ThemedText style={estilos.resumenItem}>
          🟢 <ThemedText style={estilos.resumenNegrita}>{conteo.presentes}</ThemedText> presentes
        </ThemedText>
        <ThemedText style={estilos.resumenItem}>
          🔴 <ThemedText style={estilos.resumenNegrita}>{conteo.ausentes}</ThemedText> ausentes
        </ThemedText>
      </View>

      {/* Lista de Turnos */}
      {isLoading ? (
        <EstadoCarga mensaje="Cargando agenda de canchas..." />
      ) : (
        <FlatList
          data={agenda ?? []}
          keyExtractor={(item) => item.turno.id}
          contentContainerStyle={estilos.lista}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EstadoVacio
              icono="calendar-outline"
              titulo="Sin turnos para mostrar"
              descripcion="No se encontraron franjas con los filtros seleccionados."
            />
          }
          renderItem={({ item }) => {
            const fotoAdjunta = reportesFotos[item.turno.id];
            const esConfirmada = item.estadoReserva === 'confirmada';
            const esCumplida = item.estadoReserva === 'cumplida';
            const esAusente = item.estadoReserva === 'ausente';
            const esFijo = item.turno.estado === 'fijo';
            const esLluvia = item.porLluvia || item.turno.estado === 'mantenimiento';

            return (
              <View
                style={[
                  estilos.tarjetaTurno,
                  { backgroundColor: paleta.superficie, borderColor: paleta.borde },
                ]}
              >
                {/* Cabecera del turno */}
                <View style={estilos.cabeceraTurno}>
                  <View style={estilos.filaHora}>
                    <Ionicons name="time-outline" size={16} color={paleta.primario} />
                    <ThemedText style={[estilos.horaTexto, { color: paleta.primario }]}>
                      {item.turno.inicio} - {item.turno.fin} hs
                    </ThemedText>
                  </View>

                  {/* Badge de estado */}
                  {esCumplida ? (
                    <View style={[estilos.badgeEstado, { backgroundColor: '#E8F5E9' }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: '#2E7D32' }]}>
                        ✓ Presente
                      </ThemedText>
                    </View>
                  ) : esAusente ? (
                    <View style={[estilos.badgeEstado, { backgroundColor: '#FFEBEE' }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: '#C62828' }]}>
                        No asistió
                      </ThemedText>
                    </View>
                  ) : esConfirmada ? (
                    <View style={[estilos.badgeEstado, { backgroundColor: '#FFF8E1' }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: '#F57F17' }]}>
                        Pendiente ingreso
                      </ThemedText>
                    </View>
                  ) : esFijo ? (
                    <View style={[estilos.badgeEstado, { backgroundColor: '#EDE7F6' }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: '#512DA8' }]}>
                        Fijo semanal
                      </ThemedText>
                    </View>
                  ) : esLluvia ? (
                    <View style={[estilos.badgeEstado, { backgroundColor: '#ECEFF1' }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: '#455A64' }]}>
                        {item.turno.motivoBloqueo ?? 'Suspendido'}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={[estilos.badgeEstado, { backgroundColor: paleta.fondo }]}>
                      <ThemedText style={[estilos.badgeTexto, { color: paleta.textoSecundario }]}>
                        Libre
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Info de cancha y complejo */}
                <View style={estilos.infoCancha}>
                  <ThemedText style={estilos.nombreCancha}>
                    {item.espacioNombre}
                  </ThemedText>
                  <ThemedText style={[estilos.complejoCancha, { color: paleta.textoSecundario }]}>
                    {item.complejo}
                  </ThemedText>
                </View>

                {/* Si tiene reserva con datos del jugador */}
                {item.reserva && item.jugadorNombre ? (
                  <View style={[estilos.cajaJugador, { backgroundColor: paleta.fondo }]}>
                    <View style={estilos.filaJugador}>
                      <Ionicons name="person-circle-outline" size={18} color={paleta.primario} />
                      <ThemedText style={estilos.jugadorNombre}>
                        {item.jugadorNombre}
                      </ThemedText>
                      {item.jugadorAusencias && item.jugadorAusencias > 0 ? (
                        <View style={estilos.badgeFaltas}>
                          <ThemedText style={estilos.textoFaltas}>
                            {item.jugadorAusencias} faltas
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>

                    {item.reserva.ingresoEn ? (
                      <ThemedText style={[estilos.ingresoRegistrado, { color: paleta.textoSecundario }]}>
                        Acreditado a las {item.reserva.ingresoEn.slice(11, 16)} hs
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}

                {/* Si es reserva fija */}
                {esFijo && item.titularFijo ? (
                  <View style={[estilos.cajaJugador, { backgroundColor: '#EDE7F6' }]}>
                    <ThemedText style={{ color: '#512DA8', fontWeight: '700', fontSize: 13 }}>
                      Titular: {item.titularFijo}
                    </ThemedText>
                  </View>
                ) : null}

                {/* Foto adjunta del estado de la cancha si la tomó */}
                {fotoAdjunta ? (
                  <View style={estilos.contenedorFotoAdjunta}>
                    <Image source={{ uri: fotoAdjunta }} style={estilos.fotoAdjunta} contentFit="cover" />
                    <ThemedText style={estilos.fotoEtiqueta}>Reporte de cancha adjunto</ThemedText>
                  </View>
                ) : null}

                {/* Acciones para el encargado */}
                <View style={estilos.filaAcciones}>
                  {esConfirmada ? (
                    <>
                      <Pressable
                        style={[estilos.botonPresente, { backgroundColor: '#2E7D32' }]}
                        onPress={() => item.reserva && acreditarIngresoManual(item.reserva.id)}
                        disabled={marcandoIngreso}
                      >
                        <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                        <ThemedText style={estilos.botonTextoAccion}>Acreditar</ThemedText>
                      </Pressable>

                      <Pressable
                        style={[estilos.botonAusente, { backgroundColor: '#D32F2F' }]}
                        onPress={() => setTurnoParaAusente(item)}
                        disabled={marcandoAusencia}
                      >
                        <Ionicons name="close" size={15} color="#FFFFFF" />
                        <ThemedText style={estilos.botonTextoAccion}>No asistió</ThemedText>
                      </Pressable>
                    </>
                  ) : null}

                  {/* Botón para foto de cancha */}
                  <Pressable
                    style={[estilos.botonFoto, { borderColor: paleta.borde }]}
                    onPress={() => void tomarFotoEstadoCancha(item)}
                  >
                    <Ionicons name="camera-outline" size={16} color={paleta.primario} />
                    <ThemedText style={[estilos.botonFotoTexto, { color: paleta.primario }]}>
                      {fotoAdjunta ? 'Cambiar foto' : 'Foto estado'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal para confirmar "No se presentó" */}
      <Modal visible={Boolean(turnoParaAusente)} transparent animationType="fade">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaModal, { backgroundColor: paleta.superficie }]}>
            <Ionicons name="alert-circle-outline" size={44} color="#D32F2F" />
            <ThemedText style={estilos.modalTitulo}>Marcar Ausente</ThemedText>
            <ThemedText style={[estilos.modalMensaje, { color: paleta.textoSecundario }]}>
              ¿Confirmás que el jugador{' '}
              <ThemedText style={{ fontWeight: '700', color: paleta.texto }}>
                {turnoParaAusente?.jugadorNombre ?? 'titular'}
              </ThemedText>{' '}
              no se presentó al turno? Esto sumará 1 falta en su historial.
            </ThemedText>

            <View style={estilos.modalBotones}>
              <Pressable
                style={[estilos.modalBotonCancelar, { borderColor: paleta.borde }]}
                onPress={() => setTurnoParaAusente(null)}
              >
                <ThemedText style={{ fontWeight: '600' }}>Cancelar</ThemedText>
              </Pressable>

              <Pressable
                style={[estilos.modalBotonConfirmar, { backgroundColor: '#D32F2F' }]}
                onPress={confirmarMarcarAusente}
                disabled={marcandoAusencia}
              >
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {marcandoAusencia ? 'Guardando...' : 'Confirmar falta'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  seccionDias: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  scrollDias: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chipDia: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipDiaTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  seccionFiltros: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  scrollFiltros: {
    gap: 8,
  },
  chipFiltro: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chipFiltroTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  botonSoloReservas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  textoSoloReservas: {
    fontSize: 12,
    fontWeight: '600',
  },
  barraResumen: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resumenItem: {
    fontSize: 12,
  },
  resumenNegrita: {
    fontWeight: '800',
  },
  lista: {
    padding: 12,
    paddingBottom: 24,
    gap: 12,
  },
  tarjetaTurno: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cabeceraTurno: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaHora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  horaTexto: {
    fontSize: 15,
    fontWeight: '800',
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoCancha: {
    gap: 2,
  },
  nombreCancha: {
    fontSize: 16,
    fontWeight: '700',
  },
  complejoCancha: {
    fontSize: 13,
  },
  cajaJugador: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  filaJugador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jugadorNombre: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badgeFaltas: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  textoFaltas: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '700',
  },
  ingresoRegistrado: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  contenedorFotoAdjunta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
  },
  fotoAdjunta: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  fotoEtiqueta: {
    fontSize: 12,
    fontWeight: '600',
  },
  filaAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  botonPresente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonAusente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonTextoAccion: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  botonFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  botonFotoTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  telonModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tarjetaModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalMensaje: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  modalBotonCancelar: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBotonConfirmar: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
