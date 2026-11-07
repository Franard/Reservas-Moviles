import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { ReservaDetallada } from '@/tipos';
import { BadgeEstadoReserva } from './BadgeEstadoReserva';

export interface TarjetaReservaResumenProps {
  reserva: ReservaDetallada;
  alPresionar: (reserva: ReservaDetallada) => void;
}

export function TarjetaReservaResumen({ reserva, alPresionar }: TarjetaReservaResumenProps) {
  const { paleta } = useTheme();
  const esVigente = reserva.estado === 'confirmada' && reserva.esFuturaOVigente;

  // Formato de fecha amigable tipo "19/09/2026"
  const fechaPartes = reserva.fechaISO.split('-');
  const fechaAmigable =
    fechaPartes.length === 3
      ? `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]}`
      : reserva.fechaISO;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Reserva en ${reserva.espacioNombre}, día ${fechaAmigable}, horario ${reserva.inicio} a ${reserva.fin}`}
      style={({ pressed }) => [
        estilos.tarjeta,
        {
          backgroundColor: paleta.superficie,
          borderColor: esVigente ? paleta.primario : paleta.borde,
          borderWidth: esVigente ? 1.5 : 1,
          opacity: esVigente ? (pressed ? 0.88 : 1) : 0.85,
        },
      ]}
      onPress={() => alPresionar(reserva)}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.columnaTitulo}>
          <ThemedText style={[estilos.nombreEspacio, { color: paleta.primario }]}>
            {reserva.espacioNombre}
          </ThemedText>
          <ThemedText style={[estilos.complejo, { color: paleta.textoSecundario }]}>
            {reserva.complejo}
          </ThemedText>
        </View>
        <BadgeEstadoReserva estado={reserva.estado} />
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.itemDetalle}>
          <Ionicons name="calendar-outline" size={16} color={paleta.primario} />
          <ThemedText style={estilos.textoDetalle}>
            Día {fechaAmigable}
          </ThemedText>
        </View>

        <View style={estilos.itemDetalle}>
          <Ionicons name="time-outline" size={16} color={paleta.primario} />
          <ThemedText style={estilos.textoDetalle}>
            {reserva.inicio} a {reserva.fin} hs
          </ThemedText>
        </View>

        <View style={estilos.itemDetalle}>
          <Ionicons name="people-outline" size={16} color={paleta.primario} />
          <ThemedText style={estilos.textoDetalle}>
            {reserva.cantidadPersonas} personas
          </ThemedText>
        </View>
      </View>

      <View style={[estilos.pie, { borderTopColor: paleta.borde }]}>
        <View style={estilos.badgeQrOffline}>
          <Ionicons name="shield-checkmark-outline" size={15} color={paleta.exito} />
          <ThemedText style={[estilos.textoQr, { color: paleta.exito }]}>
            QR guardado sin conexión
          </ThemedText>
        </View>

        {esVigente ? (
          <View style={[estilos.btnVerQr, { backgroundColor: paleta.primario }]}>
            <ThemedText style={[estilos.btnVerQrTexto, { color: paleta.sobrePrimario }]}>
              Ver QR ➔
            </ThemedText>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  columnaTitulo: {
    flex: 1,
    paddingRight: 8,
  },
  nombreEspacio: {
    fontSize: 17,
    fontWeight: '700',
  },
  complejo: {
    fontSize: 13,
    marginTop: 2,
  },
  cuerpo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  itemDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoDetalle: {
    fontSize: 13,
    fontWeight: '600',
  },
  pie: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeQrOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoQr: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnVerQr: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnVerQrTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
});
