import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { EstadoCarga } from '@/componentes/comun/EstadoCarga';
import { EstadoVacio } from '@/componentes/comun/EstadoVacio';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import {
  useBloqueosMantenimiento,
  useCrearBloqueoMantenimiento,
  useEliminarBloqueoMantenimiento,
} from '@/hooks/useAdminAgenda';
import { useEspacios } from '@/hooks/useEspacios';
import { useVentanaSieteDias } from '@/hooks/useDisponibilidad';
import { useTheme } from '@/hooks/useTheme';
import { notificarSuspensionPorLluviaAsync } from '@/servicios/notificaciones';
import type { BloqueoMantenimiento } from '@/tipos';
import { formatearFechaISOLocal } from '@/utils/calculoTurnos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

export default function MantenimientoAdminScreen() {
  const { paleta } = useTheme();
  const hoyISO = formatearFechaISOLocal(new Date());
  const diasVentana = useVentanaSieteDias();

  const { data: espacios } = useEspacios();
  const { data: bloqueos, isLoading, refetch, isRefetching } = useBloqueosMantenimiento();
  const { mutateAsync: crearBloqueoAsync, isPending: guardandoBloqueo } = useCrearBloqueoMantenimiento();
  const { mutateAsync: eliminarBloqueoAsync } = useEliminarBloqueoMantenimiento();

  // bloqueo individual
  const [modalVisible, setModalVisible] = useState(false);
  const [espacioId, setEspacioId] = useState('esp-01');
  const [fecha, setFecha] = useState(hoyISO);
  const [diaCompleto, setDiaCompleto] = useState(true);
  const [inicio, setInicio] = useState('08:00');
  const [fin, setFin] = useState('24:00');
  const [motivo, setMotivo] = useState('');
  const [porLluvia, setPorLluvia] = useState(true);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  //suspensión general por lluvia
  const [modalLluviaVisible, setModalLluviaVisible] = useState(false);
  const [fechaLluvia, setFechaLluvia] = useState(hoyISO);
  const [motivoLluvia, setMotivoLluvia] = useState('Alerta de tormenta y anegamiento de canchas');
  const [aplicandoLluvia, setAplicandoLluvia] = useState(false);


  const suspenderTodasPorLluvia = () => {
    setFechaLluvia(hoyISO);
    setMotivoLluvia('Alerta de tormenta y anegamiento de canchas');
    setModalLluviaVisible(true);
  };

  const ejecutarSuspensionLluvia = async () => {
    setAplicandoLluvia(true);
    try {
      const alAireLibre = (espacios ?? []).filter((e) => !e.techado);
      for (const esp of alAireLibre) {
        try {
          await crearBloqueoAsync({
            espacioId: esp.id,
            fecha: fechaLluvia,
            inicio: '08:00',
            fin: '24:00',
            motivo: motivoLluvia.trim() || 'Jornada suspendida por lluvia intensa',
            porLluvia: true,
          });
        } catch (e) {
          console.warn('Error al suspender cancha:', e);
        }
      }
      await notificarSuspensionPorLluviaAsync(
        'Canchas al Aire Libre',
        motivoLluvia.trim() || 'Lluvia intensa en el predio municipal'
      );
      setModalLluviaVisible(false);
      const diaSeleccionado = diasVentana.find((d) => d.fechaISO === fechaLluvia)?.etiquetaLarga ?? fechaLluvia;
      Alert.alert('Suspensión confirmada', `Se suspendieron todas las canchas al aire libre para ${diaSeleccionado}.`);
    } finally {
      setAplicandoLluvia(false);
    }
  };

  const guardarNuevoBloqueo = async () => {
    if (!motivo.trim()) {
      setErrorForm('Tenés que ingresar un motivo descriptivo.');
      return;
    }

    setErrorForm(null);
    try {
      const horaInicio = diaCompleto ? '08:00' : inicio;
      const horaFin = diaCompleto ? '24:00' : fin;

      const res = await crearBloqueoAsync({
        espacioId,
        fecha,
        inicio: horaInicio,
        fin: horaFin,
        motivo: motivo.trim(),
        porLluvia,
      });

      if (porLluvia) {
        const esp = (espacios ?? []).find((e) => e.id === espacioId);
        void notificarSuspensionPorLluviaAsync(
          esp?.nombre ?? 'Cancha municipal',
          motivo.trim()
        );
      }

      const cantAfectadas = res.reservasAfectadas.length;
      setModalVisible(false);
      setMotivo('');

      Alert.alert(
        'Bloqueo Aplicado',
        cantAfectadas > 0
          ? `Se aplicó el bloqueo y se cancelaron ${cantAfectadas} reservas de vecinos sin penalizarlos.`
          : 'Se aplicó el bloqueo con éxito.'
      );
    } catch (err) {
      const info = extraerInfoErrorUI(err, 'No se pudo crear el bloqueo.');
      setErrorForm(info.mensaje);
    }
  };

  const confirmarEliminarBloqueo = (bloqueo: BloqueoMantenimiento) => {
    Alert.alert(
      'Levantar Bloqueo',
      '¿Querés rehabilitar esta cancha? Los horarios bloqueados volverán a quedar libres en la grilla.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rehabilitar',
          onPress: async () => {
            try {
              await eliminarBloqueoAsync(bloqueo.id);
            } catch (e) {
              console.warn('Error al eliminar bloqueo:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={estilos.contenedor}>
      <View style={[estilos.barraAcciones, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}>
        <Pressable
          style={[estilos.botonAlertaLluvia, { backgroundColor: '#B71C1C' }]}
          onPress={suspenderTodasPorLluvia}
        >
          <Ionicons name="rainy" size={18} color="#FFFFFF" />
          <ThemedText style={estilos.textoBotonLluvia}>
            Suspender al aire libre (Lluvia)
          </ThemedText>
        </Pressable>

        <Pressable
          style={[estilos.botonNuevoBloqueo, { backgroundColor: paleta.primario }]}
          onPress={() => {
            setErrorForm(null);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={18} color={paleta.sobrePrimario} />
          <ThemedText style={[estilos.textoBotonNuevo, { color: paleta.sobrePrimario }]}>
            Nuevo bloqueo
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <EstadoCarga mensaje="Cargando bloqueos programados..." />
      ) : (
        <FlatList
          data={bloqueos ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EstadoVacio
              icono="checkmark-done-circle-outline"
              titulo="Sin bloqueos activos"
              descripcion="Todas las canchas están habilitadas normalmente para reservas."
            />
          }
          renderItem={({ item }) => {
            const espacio = (espacios ?? []).find((e) => e.id === item.espacioId);
            return (
              <View
                style={[
                  estilos.tarjetaBloqueo,
                  { backgroundColor: paleta.superficie, borderColor: paleta.borde },
                ]}
              >
                <View style={estilos.cabeceraTarjeta}>
                  <View style={estilos.filaIconoTipo}>
                    <Ionicons
                      name={item.porLluvia ? 'rainy' : 'construct-outline'}
                      size={20}
                      color={item.porLluvia ? '#0288D1' : '#E65100'}
                    />
                    <ThemedText style={estilos.tipoTexto}>
                      {item.porLluvia ? 'Lluvia / Anegamiento' : 'Mantenimiento técnico'}
                    </ThemedText>
                  </View>

                  <Pressable
                    style={estilos.botonEliminar}
                    onPress={() => confirmarEliminarBloqueo(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#C62828" />
                  </Pressable>
                </View>

                <View style={estilos.cuerpoBloqueo}>
                  <ThemedText style={[estilos.canchaNombre, { color: paleta.primario }]}>
                    {espacio?.nombre ?? item.espacioId}
                  </ThemedText>
                  <ThemedText style={[estilos.canchaComplejo, { color: paleta.textoSecundario }]}>
                    {espacio?.complejo ?? 'Complejo Municipal'} · Fecha: {item.fecha}
                  </ThemedText>
                  <ThemedText style={estilos.horarioBloqueo}>
                    Horario: {item.inicio === '08:00' && item.fin === '24:00' ? 'Día completo (08 a 24 hs)' : `${item.inicio} a ${item.fin} hs`}
                  </ThemedText>
                  <ThemedText style={[estilos.motivoBloqueo, { color: paleta.texto }]}>
                    Motivo: "{item.motivo}"
                  </ThemedText>
                </View>
              </View>
            );
          }}
        />
      )}

      {/*crear bloqueo */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaModal, { backgroundColor: paleta.superficie }]}>
            <View style={estilos.modalCabecera}>
              <ThemedText style={[estilos.modalTitulo, { color: paleta.primario }]}>
                Bloquear Cancha o Turno
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={paleta.textoSecundario} />
              </Pressable>
            </View>

            {errorForm ? (
              <View style={estilos.cajaError}>
                <ThemedText style={estilos.textoError}>{errorForm}</ThemedText>
              </View>
            ) : null}

            <ScrollView contentContainerStyle={estilos.formContenido}>
              {/* Cancha */}
              <ThemedText style={estilos.label}>Seleccionar Cancha:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChips}>
                {(espacios ?? []).map((e) => {
                  const activo = espacioId === e.id;
                  return (
                    <Pressable
                      key={e.id}
                      style={[
                        estilos.chipCancha,
                        { backgroundColor: activo ? paleta.primario : paleta.fondo },
                      ]}
                      onPress={() => setEspacioId(e.id)}
                    >
                      <ThemedText style={{ color: activo ? paleta.sobrePrimario : paleta.texto, fontSize: 12, fontWeight: '700' }}>
                        {e.nombre}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ThemedText style={estilos.label}>Fecha:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChips}>
                {diasVentana.map((d) => {
                  const activo = fecha === d.fechaISO;
                  return (
                    <Pressable
                      key={d.fechaISO}
                      style={[
                        estilos.chipCancha,
                        {
                          backgroundColor: activo ? paleta.primario : paleta.fondo,
                          borderWidth: 1,
                          borderColor: activo ? paleta.primario : paleta.borde,
                        },
                      ]}
                      onPress={() => setFecha(d.fechaISO)}
                    >
                      <ThemedText
                        style={{
                          color: activo ? paleta.sobrePrimario : paleta.texto,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {d.etiquetaCorta}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <TextInput
                style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                value={fecha}
                onChangeText={setFecha}
                placeholder="AAAA-MM-DD"
              />

              <View style={estilos.filaSwitch}>
                <ThemedText style={estilos.labelSwitch}>Bloquear jornada completa</ThemedText>
                <Switch value={diaCompleto} onValueChange={setDiaCompleto} />
              </View>

              {!diaCompleto ? (
                <View style={estilos.filaHoras}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={estilos.label}>Inicio (HH:00):</ThemedText>
                    <TextInput
                      style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                      value={inicio}
                      onChangeText={setInicio}
                      placeholder="08:00"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={estilos.label}>Fin (HH:00):</ThemedText>
                    <TextInput
                      style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                      value={fin}
                      onChangeText={setFin}
                      placeholder="24:00"
                    />
                  </View>
                </View>
              ) : null}

              <View style={estilos.filaSwitch}>
                <ThemedText style={estilos.labelSwitch}>Es por lluvia o anegamiento</ThemedText>
                <Switch value={porLluvia} onValueChange={setPorLluvia} />
              </View>

              {/* Motivo */}
              <ThemedText style={estilos.label}>Motivo del bloqueo:</ThemedText>
              <TextInput
                style={[
                  estilos.inputTexto,
                  estilos.inputArea,
                  { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde },
                ]}
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Ej: Pintura de líneas y cambio de redes"
                multiline
                numberOfLines={3}
              />

              <Pressable
                style={[estilos.botonGuardar, { backgroundColor: paleta.primario }]}
                onPress={guardarNuevoBloqueo}
                disabled={guardandoBloqueo}
              >
                <ThemedText style={[estilos.textoGuardar, { color: paleta.sobrePrimario }]}>
                  {guardandoBloqueo ? 'Aplicando...' : 'Aplicar Bloqueo'}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*suspension lluvia */}
      <Modal visible={modalLluviaVisible} transparent animationType="slide">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaModal, { backgroundColor: paleta.superficie }]}>
            <View style={estilos.modalCabecera}>
              <View style={estilos.filaIconoTipo}>
                <Ionicons name="rainy" size={22} color="#B71C1C" />
                <ThemedText style={[estilos.modalTitulo, { color: '#B71C1C' }]}>
                  Suspensión por Lluvia
                </ThemedText>
              </View>
              <Pressable onPress={() => setModalLluviaVisible(false)} disabled={aplicandoLluvia}>
                <Ionicons name="close" size={24} color={paleta.textoSecundario} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={estilos.formContenido}>
              <ThemedText style={[estilos.descripcionLluvia, { color: paleta.textoSecundario }]}>
                Podés suspender la jornada de hoy o programar la suspensión con anticipación si hay pronóstico de tormenta para los próximos días. Se cancelarán las reservas sin penalizar a los vecinos.
              </ThemedText>

              <ThemedText style={estilos.label}>Fecha a suspender:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChips}>
                {diasVentana.map((d) => {
                  const activo = fechaLluvia === d.fechaISO;
                  return (
                    <Pressable
                      key={d.fechaISO}
                      style={[
                        estilos.chipCancha,
                        {
                          backgroundColor: activo ? '#B71C1C' : paleta.fondo,
                          borderWidth: 1,
                          borderColor: activo ? '#B71C1C' : paleta.borde,
                        },
                      ]}
                      onPress={() => setFechaLluvia(d.fechaISO)}
                    >
                      <ThemedText
                        style={{
                          color: activo ? '#FFFFFF' : paleta.texto,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {d.etiquetaCorta}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ThemedText style={estilos.label}>Motivo anunciado a los vecinos:</ThemedText>
              <TextInput
                style={[
                  estilos.inputTexto,
                  estilos.inputArea,
                  { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde },
                ]}
                value={motivoLluvia}
                onChangeText={setMotivoLluvia}
                placeholder="Ej: Alerta de tormenta eléctrica y canchas anegadas"
                multiline
                numberOfLines={2}
              />

              {/* Resumen */}
              <View style={[estilos.cajaCanchasAfectadas, { backgroundColor: paleta.fondo, borderColor: paleta.borde }]}>
                <ThemedText style={[estilos.tituloCanchasAfectadas, { color: paleta.primario }]}>
                  Canchas descubiertas que se suspenderán:
                </ThemedText>
                <ThemedText style={[estilos.listaCanchasTexto, { color: paleta.textoSecundario }]}>
                  {(espacios ?? [])
                    .filter((e) => !e.techado)
                    .map((e) => e.nombre)
                    .join(' · ')}
                </ThemedText>
                <ThemedText style={estilos.avisoTechadas}>
                  ✓ Los espacios techados (Gimnasio Cerrado, Básquet Parquet y Vóley Techado) continuarán operando normalmente.
                </ThemedText>
              </View>

              <Pressable
                style={[estilos.botonGuardar, { backgroundColor: '#B71C1C', opacity: aplicandoLluvia ? 0.7 : 1 }]}
                onPress={ejecutarSuspensionLluvia}
                disabled={aplicandoLluvia}
              >
                <ThemedText style={[estilos.textoGuardar, { color: '#FFFFFF' }]}>
                  {aplicandoLluvia ? 'Aplicando suspensión...' : 'Confirmar Suspensión General'}
                </ThemedText>
              </Pressable>
            </ScrollView>
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
  barraAcciones: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  botonAlertaLluvia: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  textoBotonLluvia: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  botonNuevoBloqueo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoBotonNuevo: {
    fontWeight: '700',
    fontSize: 12,
  },
  lista: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  tarjetaBloqueo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaIconoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  botonEliminar: {
    padding: 4,
  },
  cuerpoBloqueo: {
    gap: 3,
  },
  canchaNombre: {
    fontSize: 16,
    fontWeight: '700',
  },
  canchaComplejo: {
    fontSize: 13,
  },
  horarioBloqueo: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  motivoBloqueo: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  telonModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  tarjetaModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  cajaError: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  textoError: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  formContenido: {
    gap: 10,
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollChips: {
    gap: 8,
    paddingVertical: 4,
  },
  chipCancha: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  inputTexto: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  filaSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelSwitch: {
    fontSize: 13,
    fontWeight: '600',
  },
  filaHoras: {
    flexDirection: 'row',
    gap: 12,
  },
  botonGuardar: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoGuardar: {
    fontWeight: '700',
    fontSize: 15,
  },
  descripcionLluvia: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  cajaCanchasAfectadas: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  tituloCanchasAfectadas: {
    fontSize: 12,
    fontWeight: '700',
  },
  listaCanchasTexto: {
    fontSize: 12,
    lineHeight: 16,
  },
  avisoTechadas: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 2,
  },
});
