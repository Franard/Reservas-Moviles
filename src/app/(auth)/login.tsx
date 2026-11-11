import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { useAuthContext } from '@/contextos/AuthContext';
import { useIngreso } from '@/hooks/useFormulariosAuth';
import { useTheme } from '@/hooks/useTheme';

const esquemaLogin = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

type DatosFormularioLogin = z.infer<typeof esquemaLogin>;

export default function LoginScreen() {
  const { paleta } = useTheme();
  const { redirigir } = useLocalSearchParams<{ redirigir?: string }>();
  const { hardwareBiometricoDisponible, iniciarSesionConBiometria } = useAuthContext();
  const { ejecutarIngreso, enviando, errorServidor } = useIngreso();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [autenticandoBio, setAutenticandoBio] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DatosFormularioLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      email: 'emiliano@mail.com',
      password: '123456',
    },
  });

  const redirigirSegunDestino = (rol: string) => {
    if (redirigir) {
      router.replace(redirigir as never);
      return;
    }
    if (rol === 'encargado') {
      router.replace('/(encargado)/escaneo');
    } else if (rol === 'administrador') {
      router.replace('/(admin)/mantenimiento');
    } else {
      router.replace('/(jugador)');
    }
  };

  const alEnviar = async (valores: DatosFormularioLogin) => {
    const usuario = await ejecutarIngreso(valores.email, valores.password);
    if (!usuario) return;
    redirigirSegunDestino(usuario.rol);
  };

  const alIngresarConBiometria = async () => {
    setAutenticandoBio(true);
    try {
      const exito = await iniciarSesionConBiometria();
      if (exito) {
        router.replace('/(jugador)');
      }
    } finally {
      setAutenticandoBio(false);
    }
  };

  const seleccionarCuentaDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', '123456', { shouldValidate: true });
  };

  return (
    <ThemedView style={estilos.pantalla}>
      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
          {/* Botón superior de volver / continuar como invitado */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver atrás o continuar como invitado"
            style={estilos.botonAtras}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(jugador)');
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={paleta.primario} />
            <ThemedText style={[estilos.textoAtras, { color: paleta.primario }]}>
              Volver (modo invitado)
            </ThemedText>
          </Pressable>

          <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
            Dirección de Deportes
          </ThemedText>
          <ThemedText style={[estilos.subtitulo, { color: paleta.textoSecundario }]}>
            Municipalidad de Villaguay — Ingresá a tu cuenta
          </ThemedText>

          {/* Accesos rápidos de prueba para facilitar la defensa */}
          <View style={estilos.bloqueDemos}>
            <ThemedText style={[estilos.etiquetaDemos, { color: paleta.textoSecundario }]}>
              Cuentas demo para prueba rápida:
            </ThemedText>
            <View style={estilos.filaDemos}>
              <Pressable
                style={[estilos.pillDemo, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}
                onPress={() => seleccionarCuentaDemo('emiliano@mail.com')}
              >
                <ThemedText style={estilos.textoPill}>⚽ Jugador</ThemedText>
              </Pressable>
              <Pressable
                style={[estilos.pillDemo, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}
                onPress={() => seleccionarCuentaDemo('marcelo@villaguay.gob.ar')}
              >
                <ThemedText style={estilos.textoPill}>📋 Encargado</ThemedText>
              </Pressable>
              <Pressable
                style={[estilos.pillDemo, { backgroundColor: paleta.superficie, borderColor: paleta.borde }]}
                onPress={() => seleccionarCuentaDemo('deportes@villaguay.gob.ar')}
              >
                <ThemedText style={estilos.textoPill}>🏛️ Admin</ThemedText>
              </Pressable>
            </View>
          </View>

          {errorServidor ? (
            <Text accessibilityRole="alert" style={estilos.alertaError}>
              {errorServidor}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: paleta.superficie,
                    color: paleta.texto,
                    borderColor: errors.email ? paleta.peligro : paleta.borde,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Correo electrónico"
                placeholderTextColor={paleta.textoSecundario}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Correo electrónico"
              />
            )}
          />
          {errors.email ? (
            <Text style={[estilos.textoErrorCampo, { color: paleta.peligro }]}>
              {errors.email.message}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View
                style={[
                  estilos.inputPasswordContenedor,
                  {
                    backgroundColor: paleta.superficie,
                    borderColor: errors.password ? paleta.peligro : paleta.borde,
                  },
                ]}
              >
                <TextInput
                  style={[estilos.inputPassword, { color: paleta.texto }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Contraseña"
                  placeholderTextColor={paleta.textoSecundario}
                  secureTextEntry={!mostrarPassword}
                  accessibilityLabel="Contraseña"
                />
                <Pressable
                  onPress={() => setMostrarPassword((prev) => !prev)}
                  style={estilos.iconoOjo}
                  accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  <Ionicons
                    name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={paleta.textoSecundario}
                  />
                </Pressable>
              </View>
            )}
          />
          {errors.password ? (
            <Text style={[estilos.textoErrorCampo, { color: paleta.peligro }]}>
              {errors.password.message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ingresar a la cuenta"
            style={({ pressed }) => [
              estilos.boton,
              { backgroundColor: paleta.primario, opacity: pressed || enviando ? 0.85 : 1 },
            ]}
            onPress={handleSubmit(alEnviar)}
            disabled={enviando}
          >
            <Text style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
              {enviando ? 'Ingresando...' : 'Ingresar'}
            </Text>
          </Pressable>

          {hardwareBiometricoDisponible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ingresar con huella o rostro"
              style={[
                estilos.botonBiometrico,
                { borderColor: paleta.primario, backgroundColor: paleta.superficie },
              ]}
              onPress={alIngresarConBiometria}
              disabled={autenticandoBio}
            >
              <Ionicons name="finger-print-outline" size={20} color={paleta.primario} />
              <ThemedText style={[estilos.botonBiometricoTexto, { color: paleta.primario }]}>
                {autenticandoBio ? 'Identificando...' : 'Reingreso con Biometría'}
              </ThemedText>
            </Pressable>
          ) : null}

          <Link href="/(auth)/registro" style={[estilos.enlace, { color: paleta.acento }]}>
            ¿No tenés cuenta? Registrate gratis
          </Link>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explorar catálogo de canchas como invitado"
            style={[estilos.botonInvitado, { borderColor: paleta.borde, backgroundColor: paleta.superficie }]}
            onPress={() => router.replace('/(jugador)')}
          >
            <Ionicons name="eye-outline" size={18} color={paleta.primario} />
            <ThemedText style={[estilos.textoInvitado, { color: paleta.primario }]}>
              Mirar catálogo como invitado
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  contenedor: {
    padding: 22,
    justifyContent: 'center',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    marginBottom: 16,
  },
  bloqueDemos: {
    marginBottom: 16,
  },
  etiquetaDemos: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  filaDemos: {
    flexDirection: 'row',
    gap: 8,
  },
  pillDemo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  textoPill: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertaError: {
    color: '#B71C1C',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 15,
  },
  inputPasswordContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  inputPassword: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  iconoOjo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textoErrorCampo: {
    fontSize: 13,
    marginBottom: 10,
  },
  boton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  botonTexto: {
    fontWeight: '700',
    fontSize: 16,
  },
  botonBiometrico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 12,
  },
  botonBiometricoTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
  enlace: {
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  botonAtras: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  textoAtras: {
    fontSize: 14,
    fontWeight: '700',
  },
  botonInvitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
  },
  textoInvitado: {
    fontSize: 14,
    fontWeight: '700',
  },
});
