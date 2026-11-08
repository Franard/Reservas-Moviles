import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/hooks/useAuth';

interface BotonPerfilHeaderProps {
  modo: 'panel' | 'jugador';
}

export function BotonPerfilHeader({ modo }: BotonPerfilHeaderProps) {
  const { usuario, cerrarSesion } = useAuth();

  if (!usuario) {
    if (modo === 'jugador') {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          onPress={() => router.push('/(auth)/login')}
          style={estilos.botonLogin}
        >
          <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
          <Text style={estilos.textoLogin}>Ingresar</Text>
        </Pressable>
      );
    }
    return null;
  }

  const primerNombre = usuario.nombre.split(' ')[0] ?? usuario.nombre;
  const esGestion = usuario.rol === 'administrador' || usuario.rol === 'encargado';

  const ejecutarCerrarSesion = async () => {
    try {
      await cerrarSesion();
      router.replace('/(auth)/login');
    } catch {
      // Fallback
      router.replace('/(auth)/login');
    }
  };

  const abrirMenu = () => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        `Sesión de ${usuario.nombre} (${usuario.rol}).\n\n¿Deseas cerrar sesión?`
      );
      if (confirmar) {
        void ejecutarCerrarSesion();
      }
      return;
    }

    const botones: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    // Si está en el panel de admin/encargado, opción de ver app ciudadana
    if (modo === 'panel') {
      botones.push({
        text: '👀 Ver catálogo (Jugador)',
        onPress: () => router.push('/(jugador)'),
      });
    }

    // Si está en la app de jugador y es personal municipal, opción de ir al panel
    if (modo === 'jugador' && esGestion) {
      botones.push({
        text:
          usuario.rol === 'administrador'
            ? '⚙️ Ir al Panel Admin'
            : '📋 Ir al Panel Encargado',
        onPress: () => {
          if (usuario.rol === 'administrador') {
            router.push('/(admin)/mantenimiento');
          } else {
            router.push('/(encargado)/escaneo');
          }
        },
      });
    }

    // Cerrar sesión
    botones.push({
      text: '🚪 Cerrar Sesión',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Cerrar Sesión',
          `¿Estás seguro de que deseas salir de la cuenta de ${primerNombre}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: () => void ejecutarCerrarSesion(),
            },
          ]
        );
      },
    });

    botones.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(
      usuario.nombre,
      `Rol: ${usuario.rol.toUpperCase()} — Municipalidad de Villaguay`,
      botones
    );
  };

  return (
    <View style={estilos.contenedorFila}>
      {/* Si está en la vista jugador y es admin/encargado, acceso directo al panel */}
      {modo === 'jugador' && esGestion ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acceder al panel de gestión municipal"
          onPress={() => {
            if (usuario.rol === 'administrador') {
              router.push('/(admin)/mantenimiento');
            } else {
              router.push('/(encargado)/escaneo');
            }
          }}
          style={estilos.pillGestion}
        >
          <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
          <Text style={estilos.textoGestion}>
            {usuario.rol === 'administrador' ? 'Admin' : 'Encargado'}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${usuario.nombre}. Tocar para opciones`}
        onPress={abrirMenu}
        style={estilos.botonPerfil}
      >
        <Ionicons
          name={modo === 'panel' ? 'log-out-outline' : 'person-circle-outline'}
          size={18}
          color="#FFFFFF"
        />
        <Text style={estilos.textoNombre}>{primerNombre}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 14,
  },
  botonLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  textoLogin: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  pillGestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0288D1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoGestion: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  botonPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  textoNombre: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
