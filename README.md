# Reservas Deportivas Villaguay ⚽🎾🏀

Aplicación móvil desarrollada con **React Native** y **Expo** para la gestión y reserva de turnos en las canchas y espacios deportivos municipales de la ciudad de Villaguay, Entre Ríos.

Proyecto correspondiente al **Trabajo Final Integrador** de la cátedra de Programación en Dispositivos Móviles — **TUDW / FCAD - UNER (2026)**.

---

## 📱 Funcionalidades Principales

- **Catálogo de Espacios:** Consulta de las 11 canchas municipales con fotos, características (superficie, techado, iluminación nocturna) y video de recorrido.
- **Filtros Combinados y Búsqueda:** Búsqueda en tiempo real con filtros por deporte, complejo municipal y lista de favoritos.
- **Mapa y Geolocalización:** Mapa interactivo con la ubicación de los complejos, cálculo de distancia en kilómetros y navegación asistida por GPS (Google Maps).
- **Reserva de Turnos en 2 Pasos:** Grilla de disponibilidad para los próximos 7 días con confirmación ágil de horario y cantidad de jugadores.
- **Comprobante con Código QR Offline:** Visualización del código QR y datos de la reserva incluso sin conexión a internet (almacenado localmente en SQLite).
- **Cancelación con Regla de Anticipación:** Cancelación directa y libre si se realiza con 4 o más horas de anticipación.
- **Recordatorios Locales:** Notificación automática en el dispositivo 2 horas antes de que comience el turno reservado.
- **Soporte de Tema Claro y Oscuro:** Selector de tema con paleta adaptada para uso en exteriores.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo SDK 57 (Expo Router)
- **Gestión de Estado y Servidor:** TanStack Query v5
- **Almacenamiento Local:** 
  - `expo-sqlite` para reservas y datos offline.
  - `expo-secure-store` para guardado seguro de credenciales.
- **Multimedia y Hardware:**
  - `expo-video` para reproducción audiovisual.
  - `react-native-maps` y `expo-location` para mapas y geolocalización.
  - `expo-notifications` para recordatorios locales programados.
  - `react-native-qrcode-svg` para generación de códigos QR vectoriales.

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npx expo start
```

### 4. Probar la aplicación
- **En celular físico:** Escanear el código QR que aparece en la terminal usando la aplicación **Expo Go** (Android / iOS) conectando el teléfono a la misma red Wi-Fi.
- **En navegador web:** Presionar la tecla `w` en la consola.
- **En emulador Android:** Presionar la tecla `a` con el emulador abierto.
