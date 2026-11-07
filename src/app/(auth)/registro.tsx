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
import { Link, router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { ThemedView } from '@/componentes/comun/ThemedView';
import { useRegistroCuenta } from '@/hooks/useFormulariosAuth';
import { useTheme } from '@/hooks/useTheme';

const esquemaRegistro = z.object({
  nombre: z.string().min(3, 'Ingresá tu nombre y apellido'),
  email: z.string().email('Ingresá un correo electrónico válido'),
  telefono: z.string().min(6, 'Ingresá un teléfono de contacto válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type DatosFormularioRegistro = z.infer<typeof esquemaRegistro>;

export default function RegistroScreen() {
  const { paleta } = useTheme();
  const { ejecutarRegistro, enviando, errorServidor } = useRegistroCuenta();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosFormularioRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
    },
  });

  const alRegistrar = async (valores: DatosFormularioRegistro) => {
    const usuario = await ejecutarRegistro(valores);
    if (usuario) {
      router.replace('/(jugador)');
    }
  };

  return (
    <ThemedView style={estilos.pantalla}>
      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
          <ThemedText style={[estilos.titulo, { color: paleta.primario }]}>
            Crear cuenta de Jugador
          </ThemedText>
          <ThemedText style={[estilos.subtitulo, { color: paleta.textoSecundario }]}>
            Completá tus datos para confirmar turnos deportivos en Villaguay
          </ThemedText>

          {errorServidor ? (
            <Text accessibilityRole="alert" style={estilos.alertaError}>
              {errorServidor}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="nombre"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: paleta.superficie,
                    color: paleta.texto,
                    borderColor: errors.nombre ? paleta.peligro : paleta.borde,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Nombre y apellido"
                placeholderTextColor={paleta.textoSecundario}
                accessibilityLabel="Nombre y apellido"
              />
            )}
          />
          {errors.nombre ? (
            <Text style={[estilos.textoErrorCampo, { color: paleta.peligro }]}>
              {errors.nombre.message}
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
            name="telefono"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: paleta.superficie,
                    color: paleta.texto,
                    borderColor: errors.telefono ? paleta.peligro : paleta.borde,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Teléfono (ej. 3455-401122)"
                placeholderTextColor={paleta.textoSecundario}
                keyboardType="phone-pad"
                accessibilityLabel="Teléfono de contacto"
              />
            )}
          />
          {errors.telefono ? (
            <Text style={[estilos.textoErrorCampo, { color: paleta.peligro }]}>
              {errors.telefono.message}
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
                  placeholder="Contraseña (mínimo 6 caracteres)"
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
            accessibilityLabel="Confirmar creación de cuenta"
            style={({ pressed }) => [
              estilos.boton,
              { backgroundColor: paleta.exito, opacity: pressed || enviando ? 0.85 : 1 },
            ]}
            onPress={handleSubmit(alRegistrar)}
            disabled={enviando}
          >
            <Text style={[estilos.botonTexto, { color: paleta.sobrePrimario }]}>
              {enviando ? 'Registrando...' : 'Crear cuenta'}
            </Text>
          </Pressable>

          <Link href="/(auth)/login" style={[estilos.enlace, { color: paleta.acento }]}>
            ¿Ya tenés cuenta? Iniciar sesión
          </Link>
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
  enlace: {
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});
