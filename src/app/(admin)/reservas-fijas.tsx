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
  useAlternarReservaFija,
  useCrearReservaFija,
  useReservasFijas,
} from '@/hooks/useAdminAgenda';
import { useActualizarPrecioEspacio, useEspacios } from '@/hooks/useEspacios';
import { useTheme } from '@/hooks/useTheme';
import type { Espacio, ReservaFija } from '@/tipos';
import { formatearFechaISOLocal } from '@/utils/calculoTurnos';
import { extraerInfoErrorUI } from '@/utils/erroresUI';

const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function ReservasFijasAdminScreen() {
  const { paleta } = useTheme();
  const [seccionActiva, setSeccionActiva] = useState<'fijas' | 'precios'>('fijas');

  // Datos
  const { data: fijas, isLoading: cargandoFijas, refetch: refetchFijas } = useReservasFijas();
  const { data: espacios, isLoading: cargandoEspacios, refetch: refetchEspacios } = useEspacios();

  const { mutateAsync: crearFijaAsync, isPending: guardandoFija } = useCrearReservaFija();
  const { mutateAsync: alternarFijaAsync } = useAlternarReservaFija();
  const { mutateAsync: actualizarPrecioAsync, isPending: guardandoPrecio } = useActualizarPrecioEspacio();

  const [modalFijaVisible, setModalFijaVisible] = useState(false);
  const [espacioIdFija, setEspacioIdFija] = useState('esp-01');
  const [titular, setTitular] = useState('');
  const [diaSemana, setDiaSemana] = useState<number>(2); // Martes
  const [inicio, setInicio] = useState('18:00');
  const [fin, setFin] = useState('20:00');
  const [desde, setDesde] = useState(formatearFechaISOLocal(new Date()));
  const [errorFija, setErrorFija] = useState<string | null>(null);

  const [espacioParaPrecio, setEspacioParaPrecio] = useState<Espacio | null>(null);
  const [nuevoPrecioTexto, setNuevoPrecioTexto] = useState('');
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null);

  const guardarFija = async () => {
    if (!titular.trim()) {
      setErrorFija('Ingresá el nombre del club, escuela o grupo titular.');
      return;
    }
    setErrorFija(null);

    try {
      await crearFijaAsync({
        espacioId: espacioIdFija,
        titular: titular.trim(),
        dia: diaSemana as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        inicio,
        fin,
        desde,
        hasta: null,
      });
      setModalFijaVisible(false);
      setTitular('');
      Alert.alert('Éxito', 'Reserva fija semanal creada correctamente.');
    } catch (err) {
      const info = extraerInfoErrorUI(err, 'No se pudo crear la reserva fija.');
      setErrorFija(info.mensaje);
    }
  };

  const guardarPrecio = async () => {
    if (!espacioParaPrecio) return;
    const precioNum = Number(nuevoPrecioTexto);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setErrorPrecio('El precio debe ser un número mayor a cero.');
      return;
    }
    setErrorPrecio(null);

    try {
      await actualizarPrecioAsync({
        espacioId: espacioParaPrecio.id,
        nuevoPrecioPorHora: precioNum,
      });
      setEspacioParaPrecio(null);
      Alert.alert('Precio Actualizado', 'El nuevo valor por hora ya está activo en el catálogo.');
    } catch (err) {
      const info = extraerInfoErrorUI(err, 'No se pudo actualizar el precio.');
      setErrorPrecio(info.mensaje);
    }
  };

  const alternarEstadoFija = async (fija: ReservaFija) => {
    try {
      await alternarFijaAsync({ fijaId: fija.id, activa: !fija.activa });
    } catch (e) {
      console.warn('Error al pausar/activar fija:', e);
    }
  };

  return (
    <ThemedView style={estilos.contenedor}>
      <View style={[estilos.barraPestanas, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}>
        <Pressable
          style={[
            estilos.pestana,
            seccionActiva === 'fijas' && { borderBottomColor: paleta.primario, borderBottomWidth: 3 },
          ]}
          onPress={() => setSeccionActiva('fijas')}
        >
          <Ionicons
            name="repeat-outline"
            size={18}
            color={seccionActiva === 'fijas' ? paleta.primario : paleta.textoSecundario}
          />
          <ThemedText
            style={[
              estilos.pestanaTexto,
              { color: seccionActiva === 'fijas' ? paleta.primario : paleta.textoSecundario },
            ]}
          >
            Fijas Semanales
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            estilos.pestana,
            seccionActiva === 'precios' && { borderBottomColor: paleta.primario, borderBottomWidth: 3 },
          ]}
          onPress={() => setSeccionActiva('precios')}
        >
          <Ionicons
            name="cash-outline"
            size={18}
            color={seccionActiva === 'precios' ? paleta.primario : paleta.textoSecundario}
          />
          <ThemedText
            style={[
              estilos.pestanaTexto,
              { color: seccionActiva === 'precios' ? paleta.primario : paleta.textoSecundario },
            ]}
          >
            Tarifas ($/h)
          </ThemedText>
        </Pressable>
      </View>

      {seccionActiva === 'fijas' ? (
        <View style={estilos.contenedorSeccion}>
          <View style={estilos.filaBotonNuevo}>
            <ThemedText style={[estilos.subtituloSeccion, { color: paleta.textoSecundario }]}>
              Reglas semanales de clubes y escuelas
            </ThemedText>
            <Pressable
              style={[estilos.botonNuevo, { backgroundColor: paleta.primario }]}
              onPress={() => {
                setErrorFija(null);
                setModalFijaVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color={paleta.sobrePrimario} />
              <ThemedText style={[estilos.botonNuevoTexto, { color: paleta.sobrePrimario }]}>
                Nueva fija
              </ThemedText>
            </Pressable>
          </View>

          {cargandoFijas ? (
            <EstadoCarga mensaje="Cargando reservas periódicas..." />
          ) : (
            <FlatList
              data={fijas ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={estilos.lista}
              onRefresh={refetchFijas}
              refreshing={false}
              ListEmptyComponent={
                <EstadoVacio
                  icono="calendar-outline"
                  titulo="Sin reservas fijas"
                  descripcion="No hay turnos semanales configurados actualmente."
                />
              }
              renderItem={({ item }) => {
                const espacio = (espacios ?? []).find((e) => e.id === item.espacioId);
                const nombreDia = NOMBRES_DIAS[item.dia] ?? 'Día';

                return (
                  <View
                    style={[
                      estilos.tarjetaFija,
                      { backgroundColor: paleta.superficie, borderColor: paleta.borde },
                    ]}
                  >
                    <View style={estilos.cabeceraFija}>
                      <ThemedText style={[estilos.titularTexto, { color: paleta.primario }]}>
                        {item.titular}
                      </ThemedText>
                      <View style={estilos.filaSwitchFija}>
                        <ThemedText style={[estilos.estadoSwitchTexto, { color: item.activa ? '#2E7D32' : paleta.textoSecundario }]}>
                          {item.activa ? 'Activa' : 'Pausada'}
                        </ThemedText>
                        <Switch
                          value={item.activa}
                          onValueChange={() => void alternarEstadoFija(item)}
                        />
                      </View>
                    </View>

                    <ThemedText style={[estilos.infoFija, { color: paleta.texto }]}>
                      Todos los {nombreDia}s de {item.inicio} a {item.fin} hs
                    </ThemedText>

                    <ThemedText style={[estilos.canchaFija, { color: paleta.textoSecundario }]}>
                      {espacio?.nombre ?? item.espacioId} · {espacio?.complejo ?? 'Polideportivo'}
                    </ThemedText>
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : (
        <View style={estilos.contenedorSeccion}>
          <ThemedText style={[estilos.subtituloSeccion, estilos.paddingSeccion, { color: paleta.textoSecundario }]}>
            Precios vigentes por turno de 1 hora
          </ThemedText>

          {cargandoEspacios ? (
            <EstadoCarga mensaje="Cargando tarifas municipales..." />
          ) : (
            <FlatList
              data={espacios ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={estilos.lista}
              onRefresh={refetchEspacios}
              refreshing={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    estilos.tarjetaPrecio,
                    { backgroundColor: paleta.superficie, borderColor: paleta.borde },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[estilos.canchaNombrePrecio, { color: paleta.primario }]}>
                      {item.nombre}
                    </ThemedText>
                    <ThemedText style={[estilos.canchaComplejoPrecio, { color: paleta.textoSecundario }]}>
                      {item.complejo}
                    </ThemedText>
                  </View>

                  <View style={estilos.columnaPrecioAccion}>
                    <ThemedText style={[estilos.valorPrecio, { color: paleta.exito }]}>
                      ${item.precioPorHora.toLocaleString('es-AR')}
                    </ThemedText>
                    <Pressable
                      style={[estilos.botonEditarPrecio, { backgroundColor: paleta.fondo, borderColor: paleta.borde }]}
                      onPress={() => {
                        setEspacioParaPrecio(item);
                        setNuevoPrecioTexto(String(item.precioPorHora));
                        setErrorPrecio(null);
                      }}
                    >
                      <Ionicons name="pencil" size={14} color={paleta.primario} />
                      <ThemedText style={[estilos.textoEditarPrecio, { color: paleta.primario }]}>
                        Modificar
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
      {/*Reserva fija*/}
      <Modal visible={modalFijaVisible} transparent animationType="slide">
        <View style={estilos.telonModal}>
          <View style={[estilos.tarjetaModal, { backgroundColor: paleta.superficie }]}>
            <View style={estilos.modalCabecera}>
              <ThemedText style={[estilos.modalTitulo, { color: paleta.primario }]}>
                Nueva Reserva Fija Semanal
              </ThemedText>
              <Pressable onPress={() => setModalFijaVisible(false)}>
                <Ionicons name="close" size={24} color={paleta.textoSecundario} />
              </Pressable>
            </View>

            {errorFija ? (
              <View style={estilos.cajaError}>
                <ThemedText style={estilos.textoError}>{errorFija}</ThemedText>
              </View>
            ) : null}

            <ScrollView contentContainerStyle={estilos.formContenido}>
              <ThemedText style={estilos.label}>Titular (Club / Escuela / Grupo):</ThemedText>
              <TextInput
                style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                value={titular}
                onChangeText={setTitular}
                placeholder="Ej: Escuela Municipal de Vóley"
              />

              <ThemedText style={estilos.label}>Espacio Deportivo:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChips}>
                {(espacios ?? []).map((e) => {
                  const activo = espacioIdFija === e.id;
                  return (
                    <Pressable
                      key={e.id}
                      style={[
                        estilos.chipCancha,
                        { backgroundColor: activo ? paleta.primario : paleta.fondo },
                      ]}
                      onPress={() => setEspacioIdFija(e.id)}
                    >
                      <ThemedText style={{ color: activo ? paleta.sobrePrimario : paleta.texto, fontSize: 12, fontWeight: '700' }}>
                        {e.nombre}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ThemedText style={estilos.label}>Día de repetición semanal:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChips}>
                {NOMBRES_DIAS.map((nombre, idx) => {
                  const activo = diaSemana === idx;
                  return (
                    <Pressable
                      key={nombre}
                      style={[
                        estilos.chipCancha,
                        { backgroundColor: activo ? paleta.acento : paleta.fondo },
                      ]}
                      onPress={() => setDiaSemana(idx)}
                    >
                      <ThemedText style={{ color: activo ? '#FFFFFF' : paleta.texto, fontSize: 12, fontWeight: '700' }}>
                        {nombre}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={estilos.filaHoras}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={estilos.label}>Inicio (HH:00):</ThemedText>
                  <TextInput
                    style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                    value={inicio}
                    onChangeText={setInicio}
                    placeholder="18:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={estilos.label}>Fin (HH:00):</ThemedText>
                  <TextInput
                    style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                    value={fin}
                    onChangeText={setFin}
                    placeholder="20:00"
                  />
                </View>
              </View>

              <ThemedText style={estilos.label}>Fecha inicio de vigencia:</ThemedText>
              <TextInput
                style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde }]}
                value={desde}
                onChangeText={setDesde}
                placeholder="AAAA-MM-DD"
              />

              <Pressable
                style={[estilos.botonGuardar, { backgroundColor: paleta.primario }]}
                onPress={guardarFija}
                disabled={guardandoFija}
              >
                <ThemedText style={[estilos.textoGuardar, { color: paleta.sobrePrimario }]}>
                  {guardandoFija ? 'Guardando...' : 'Crear Reserva Fija'}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*Precio */}
      <Modal visible={Boolean(espacioParaPrecio)} transparent animationType="fade">
        <View style={estilos.telonModalCentro}>
          <View style={[estilos.tarjetaModalCentro, { backgroundColor: paleta.superficie }]}>
            <ThemedText style={[estilos.modalTitulo, { color: paleta.primario }]}>
              Modificar Tarifa por Hora
            </ThemedText>
            <ThemedText style={{ fontSize: 13, color: paleta.textoSecundario, marginBottom: 8 }}>
              {espacioParaPrecio?.nombre}
            </ThemedText>

            {errorPrecio ? (
              <View style={estilos.cajaError}>
                <ThemedText style={estilos.textoError}>{errorPrecio}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={estilos.label}>Nuevo precio ($ ARS):</ThemedText>
            <TextInput
              style={[estilos.inputTexto, { backgroundColor: paleta.fondo, color: paleta.texto, borderColor: paleta.borde, width: '100%' }]}
              value={nuevoPrecioTexto}
              onChangeText={setNuevoPrecioTexto}
              keyboardType="numeric"
              placeholder="Ej: 14000"
            />

            <View style={estilos.modalBotones}>
              <Pressable
                style={[estilos.modalBotonCancelar, { borderColor: paleta.borde }]}
                onPress={() => setEspacioParaPrecio(null)}
              >
                <ThemedText style={{ fontWeight: '600' }}>Cancelar</ThemedText>
              </Pressable>

              <Pressable
                style={[estilos.modalBotonConfirmar, { backgroundColor: paleta.primario }]}
                onPress={guardarPrecio}
                disabled={guardandoPrecio}
              >
                <ThemedText style={{ color: paleta.sobrePrimario, fontWeight: '700' }}>
                  {guardandoPrecio ? 'Guardando...' : 'Guardar precio'}
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
  barraPestanas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  pestana: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  pestanaTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
  contenedorSeccion: {
    flex: 1,
  },
  filaBotonNuevo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subtituloSeccion: {
    fontSize: 13,
  },
  paddingSeccion: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonNuevoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  lista: {
    padding: 14,
    gap: 10,
    paddingBottom: 24,
  },
  tarjetaFija: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cabeceraFija: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titularTexto: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  filaSwitchFija: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estadoSwitchTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoFija: {
    fontSize: 14,
    fontWeight: '600',
  },
  canchaFija: {
    fontSize: 12,
  },
  tarjetaPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  canchaNombrePrecio: {
    fontSize: 15,
    fontWeight: '700',
  },
  canchaComplejoPrecio: {
    fontSize: 12,
    marginTop: 2,
  },
  columnaPrecioAccion: {
    alignItems: 'flex-end',
    gap: 6,
  },
  valorPrecio: {
    fontSize: 16,
    fontWeight: '800',
  },
  botonEditarPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  textoEditarPrecio: {
    fontSize: 11,
    fontWeight: '600',
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
  telonModalCentro: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tarjetaModalCentro: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 12,
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
