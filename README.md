# Reservas Deportivas Villaguay ⚽🎾🏀

Aplicación móvil desarrollada con **React Native** y **Expo** para la gestión y reserva de turnos en las canchas y espacios deportivos municipales de la ciudad de Villaguay, Entre Ríos.

Proyecto correspondiente al **Trabajo Final Integrador** de la cátedra de Programación en Dispositivos Móviles — **TUDW / FCAD - UNER (2026)**.

---

## 📱 Funcionalidades de la Aplicación

### 1. Experiencia del Jugador (Vecino)
- **Catálogo de Espacios:** Consulta de las 11 canchas municipales con fotos, características (superficie, techado, iluminación nocturna) y video de recorrido nativo.
- **Filtros Combinados y Búsqueda:** Búsqueda en tiempo real con filtros por deporte, complejo municipal y favoritos.
- **Mapa y Geolocalización:** Mapa interactivo con la ubicación de los complejos, cálculo de distancia en kilómetros desde el GPS del dispositivo y navegación asistida.
- **Reserva de Turnos en 2 Pasos:** Grilla de disponibilidad para los próximos 7 días con confirmación ágil de horario y cantidad de jugadores.
- **Comprobante con Código QR Offline:** Visualización del código QR y datos de la reserva incluso sin conexión a internet (almacenado localmente en SQLite).
- **Cancelación con Regla de 4 Horas:** Cancelación directa si faltan más de 4 horas; registro de cancelación tardía si se realiza fuera de término.
- **Recordatorios Locales:** Notificación automática en el dispositivo 2 horas antes de que comience el partido.
- **Tema Claro y Oscuro:** Selector de tema adaptado para uso nocturno o a plena luz del sol.

### 2. Panel de Encargado (Marcelo)
- **Escáner QR de Puerta:** Lector de códigos con la cámara del dispositivo (`expo-camera`), protegido por biometría (`expo-local-authentication`), con vibración háptica diferenciada (`expo-haptics`) ante ingresos válidos o rechazados.
- **Agenda Diaria de Control:** Visualización de todos los turnos del día, acreditación manual de asistencia y marcado de inasistencias ("No se presentó").
- **Reporte Fotográfico:** Captura de fotos del estado de las canchas con la cámara (`expo-image-picker`) y almacenamiento persistente en el dispositivo (`expo-file-system`).

### 3. Panel de Administrador (Nahuel)
- **Suspensión por Lluvia:** Botón de acción rápida para bloquear turnos en canchas al aire libre ante inclemencias climáticas.
- **Reservas Fijas Semanales:** Creación y activación de turnos fijos para clubes y escuelas deportivas.
- **Gestión de Tarifas:** Actualización de precios por hora para cada espacio deportivo.

---

## 👥 Cuentas de Prueba (Demo Cátedra)

Todas las cuentas utilizan la contraseña unificada: **`villaguay2026`**

| Rol | Correo Electrónico | Contraseña | Alcance / Pruebas |
|---|---|---|---|
| **Jugador** | `emiliano@mail.com` | `villaguay2026` | Catálogo, reservas activas, historial y QR offline. |
| **Encargado** | `marcelo@villaguay.demo.ar` | `villaguay2026` | Escáner QR en puerta, agenda del día y fotos de canchas. |
| **Administrador** | `nahuel@villaguay.demo.ar` | `villaguay2026` | Bloqueos por lluvia, reservas fijas y cambio de tarifas. |

---

## 🌐 Conexión con la API de la Cátedra

Esta aplicación consume la API oficial provista por la cátedra de Desarrollo para Móviles (UNER):
- **Repositorio de la API:** [github.com/franco-ruisdias-uner/api-proyectos-mobile](https://github.com/franco-ruisdias-uner/api-proyectos-mobile)
- **Proyecto específico:** `api-reservas-deportivas` (NestJS).

Por defecto, la aplicación opera bajo una arquitectura **Offline-First**: si no hay un servidor backend activo o no hay conexión de red, la app funciona de manera autónoma utilizando su base de datos local SQLite (`expo-sqlite`), SecureStore para tokens y una capa de datos de prueba idéntica a la del backend oficial.

Para conectar la app a una instancia local de la API, se puede configurar la variable de entorno en `.env`:
```bash
EXPO_PUBLIC_API_URL=http://<IP_DE_TU_PC>:3000
```

---

## 📋 Auditoría de Requisitos Mínimos (TFI - FCAD UNER)

| # | Requisito de la Cátedra | Implementación en el Proyecto |
|---|---|---|
| **1** | **Pantallas y navegación** | Navegación completa por roles con **Expo Router** (`src/app/`). |
| **2** | **Autenticación y seguridad** | Tokens en `expo-secure-store`, sesión persistente y biometría con `expo-local-authentication`. |
| **3** | **Consumo de API y estados** | Capa de servicios desacoplada con estados de carga, vacío y error en pantalla. |
| **4** | **Cámara y sistema de archivos** | `expo-camera` para QR, `expo-image-picker` y persistencia con `expo-file-system` (`File`, `Paths`). |
| **5** | **Ubicación y mapas** | `expo-location` con cálculo de distancia Haversine y visor interactivo de mapas. |
| **6** | **Notificaciones locales** | `expo-notifications` con recordatorios automáticos 2 hs antes del turno y avisos de suspensión. |
| **7** | **Persistencia y conectividad** | `expo-sqlite` para datos offline, `kv-store` para preferencias y `expo-network` para estado de red. |
| **8** | **Sensores o háptica** | `expo-haptics` en el escáner QR de portería con respuesta táctil de éxito y error. |
| **9** | **Multimedia** | `expo-video` con reproductor nativo y controles a la vista en la ficha de cancha. |
| **10** | **Identidad de la aplicación** | Ícono institucional `1024x1024` PNG sin transparencias, adaptive icon y splash screen. |

---

## 🛠️ Tecnologías y Librerías

- **Framework:** React Native (0.86) + Expo SDK 57 (Expo Router)
- **Lenguaje:** TypeScript Estricto
- **Estado y Caché:** TanStack Query v5
- **Persistencia:** `expo-sqlite`, `expo-sqlite/kv-store`, `expo-secure-store`
- **Hardware y Dispositivo:** `expo-camera`, `expo-location`, `expo-local-authentication`, `expo-haptics`, `expo-notifications`, `expo-image-picker`, `expo-file-system`, `expo-network`
- **Multimedia e Iconografía:** `expo-video`, `expo-image`, `@react-native-vector-icons/ionicons`, `react-native-qrcode-svg`, `react-native-webview`

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/Franard/Reservas-Moviles.git
cd Reservas-Moviles
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el entorno de desarrollo
```bash
npx expo start
```

### 4. Probar en dispositivo
- **En celular físico:** Escanear el código QR desde la app **Expo Go** (Android / iOS) con el teléfono en la misma red Wi-Fi o conectado por cable USB con depuración activada.
- **En emulador Android:** Presionar la tecla `a` en la terminal.
- **En navegador web:** Presionar la tecla `w` en la terminal.
