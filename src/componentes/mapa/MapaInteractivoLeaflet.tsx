import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface ComplejoInfo {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

interface MapaInteractivoLeafletProps<T extends ComplejoInfo = ComplejoInfo> {
  complejos: T[];
  seleccionado: T;
  alSeleccionar: (c: T) => void;
  altura?: number;
}

export function MapaInteractivoLeaflet<T extends ComplejoInfo = ComplejoInfo>({
  complejos,
  seleccionado,
  alSeleccionar,
  altura = 240,
}: MapaInteractivoLeafletProps<T>) {
  const webViewRef = useRef<WebView>(null);

  // Cada vez que cambia el complejo seleccionado, centramos el mapa suavemente
  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (window.centrarComplejo) {
          window.centrarComplejo(${seleccionado.latitud}, ${seleccionado.longitud}, '${seleccionado.id}');
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [seleccionado]);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0F172A; }
    #map { width: 100%; height: 100%; }
    .pin-complejo {
      background: #0B3A5D;
      color: #FFFFFF;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      transition: all 0.25s ease;
    }
    .pin-complejo.activo {
      background: #0288D1;
      border-color: #38BDF8;
      transform: scale(1.2);
    }
    .leaflet-popup-content-wrapper {
      background: #1E293B;
      color: #F8FAFC;
      border-radius: 10px;
      font-family: system-ui, sans-serif;
    }
    .leaflet-popup-tip {
      background: #1E293B;
    }
    .popup-titulo {
      font-size: 13px;
      font-weight: 700;
      color: #38BDF8;
      margin-bottom: 2px;
    }
    .popup-dir {
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${seleccionado.latitud}, ${seleccionado.longitud}], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var marcadores = {};
    var complejos = ${JSON.stringify(complejos)};

    function obtenerEmoji(id) {
      if (id === 'parque-berduc') return '🎾';
      if (id === 'gimnasio-cerrado') return '🏀';
      return '⚽';
    }

    complejos.forEach(function(comp) {
      var esActivo = comp.id === '${seleccionado.id}';
      var customIcon = L.divIcon({
        className: 'pin-complejo' + (esActivo ? ' activo' : ''),
        html: obtenerEmoji(comp.id),
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      var marker = L.marker([comp.latitud, comp.longitud], { icon: customIcon }).addTo(map);
      marker.bindPopup('<div class="popup-titulo">' + comp.nombre + '</div><div class="popup-dir">' + comp.direccion + '</div>');

      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'SELECCIONADO', id: comp.id }));
        }
      });

      marcadores[comp.id] = marker;
    });

    window.centrarComplejo = function(lat, lng, id) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
      Object.keys(marcadores).forEach(function(key) {
        var el = marcadores[key].getElement();
        if (el) {
          if (key === id) {
            el.classList.add('activo');
          } else {
            el.classList.remove('activo');
          }
        }
      });
      if (marcadores[id]) {
        marcadores[id].openPopup();
      }
    };
  </script>
</body>
</html>
  `;

  return (
    <View style={[estilos.contenedor, { height: altura }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={estilos.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.tipo === 'SELECCIONADO') {
              const comp = complejos.find((c) => c.id === data.id);
              if (comp) alSeleccionar(comp);
            }
          } catch {
            // Ignorar
          }
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
