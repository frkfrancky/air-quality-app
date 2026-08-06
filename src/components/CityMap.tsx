import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentCoords, Coords } from '../hooks/useCurrentCoords';
import { estimateTrafficIntensity } from '../services/offlineTraffic';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

// Variante native (iOS/Android) : une vraie carte OpenStreetMap/Leaflet chargée dans une WebView.
// Le web utilise une implémentation séparée (CityMap.web.tsx) qui monte Leaflet directement dans
// le DOM — react-native-webview n'a pas de support web, Metro choisit donc le bon fichier selon
// la plateforme grâce à l'extension `.web.tsx`.
//
// La page HTML interroge Open-Meteo elle-même pour la qualité de l'air (son contexte JS est isolé
// de React Native, donc pas moyen de réutiliser directement services/openMeteo.ts) et prévient
// React Native de chaque clic via `window.ReactNativeWebView.postMessage`, ce qui permet à
// CityScreen de rendre CityScene dynamique. Le trafic, lui, est calculé côté React Native (hors
// ligne, voir services/offlineTraffic.ts — le dataset de villes embarqué n'a pas de raison d'être
// dupliqué dans la page HTML) puis injecté dans la page via `injectJavaScript`.

interface CityMapProps {
  /** Affiche un bouton de fermeture (utile quand ce composant est présenté en superposition). */
  onClose?: () => void;
  /** Appelé à chaque fois que l'utilisateur touche un point de la carte. */
  onSelectLocation?: (coords: Coords) => void;
}

// Centre de secours (France) si la géolocalisation échoue ou est refusée — la carte reste
// utilisable, l'utilisateur peut toucher n'importe où pour choisir un point.
const FALLBACK_CENTER: Coords = { latitude: 46.6, longitude: 2.4 };

// Même clé que services/tomtom.ts. Si elle est configurée, la page fait une vraie requête TomTom ;
// sinon le trafic vient de l'estimation hors ligne, injectée depuis React Native.
const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

function buildMapHtml(start: Coords, zoom: number, gpsCoords: Coords | null): string {
  const trafficFetchScript = TOMTOM_API_KEY
    ? `
      fetchTraffic(lat, lon)
        .then(function (v) { lastTraffic = v; renderPopup(); })
        .catch(function () { lastTraffic = null; renderPopup(); });
    `
    : ''; // Sinon, window.setTrafficValue() est appelé depuis React Native (voir onLoadEnd/handleMessage).

  const tomtomFunctionScript = TOMTOM_API_KEY
    ? `
      function fetchTraffic(lat, lon) {
        return fetch('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=' + lat + ',' + lon + '&key=${TOMTOM_API_KEY}')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var d = data.flowSegmentData || {};
            if (!d.freeFlowSpeed) return 0;
            var congestion = 1 - d.currentSpeed / d.freeFlowSpeed;
            return Math.round(Math.min(100, Math.max(0, congestion * 100)));
          });
      }
    `
    : '';

  const myLocationScript = gpsCoords
    ? `
      var myIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#1565C0;border:3px solid #fff;box-shadow:0 0 0 4px rgba(21,101,192,0.35);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([${gpsCoords.latitude}, ${gpsCoords.longitude}], { icon: myIcon }).addTo(map).bindPopup('Ma position');
    `
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map').setView([${start.latitude}, ${start.longitude}], ${zoom});
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
      }).addTo(map);

      ${tomtomFunctionScript}

      ${myLocationScript}

      // Épingle rouge pour le point choisi en touchant l'écran — se déplace à chaque sélection.
      var pinIcon = L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#E53935;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.35);transform:rotate(-45deg);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });
      var pin = L.marker([${start.latitude}, ${start.longitude}], { icon: pinIcon }).addTo(map);

      var lastAQ = null;
      var lastTraffic = null;

      function renderPopup() {
        var lines = [];
        if (lastAQ) {
          lines.push('<strong>IQA ' + Math.round(lastAQ.us_aqi || 0) + '</strong>');
          lines.push('PM2.5 : ' + Math.round(lastAQ.pm2_5 || 0) + ' µg/m³');
          lines.push('PM10 : ' + Math.round(lastAQ.pm10 || 0) + ' µg/m³');
          lines.push('Ozone : ' + Math.round(lastAQ.ozone || 0) + ' µg/m³');
        } else {
          lines.push("Qualité de l'air indisponible");
        }
        lines.push(lastTraffic !== null ? ('Trafic : ' + lastTraffic + '/100') : 'Trafic indisponible');
        pin.setPopupContent(lines.join('<br/>'));
      }

      // Appelé depuis React Native avec la valeur hors ligne (voir CityMap.tsx).
      window.setTrafficValue = function (value) {
        lastTraffic = value;
        renderPopup();
      };

      function showValuesAt(lat, lon) {
        lastAQ = null;
        pin.setLatLng([lat, lon]);
        pin.bindPopup('Chargement…').openPopup();
        renderPopup();

        fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=pm2_5,pm10,ozone,us_aqi')
          .then(function (r) { return r.json(); })
          .then(function (data) { lastAQ = data.current || null; renderPopup(); })
          .catch(function () { lastAQ = null; renderPopup(); });

        ${trafficFetchScript}
      }

      map.on('click', function (e) {
        // .wrap() ramène la longitude dans [-180, 180] : sans ça, un clic après avoir fait défiler
        // la carte plusieurs fois autour du globe renvoie une longitude hors plage (ex. 190° au lieu
        // de -170°), qu'Open-Meteo ne sait pas résoudre — d'où l'absence de valeurs dans certaines zones.
        var wrapped = e.latlng.wrap();
        showValuesAt(wrapped.lat, wrapped.lng);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: wrapped.lat, longitude: wrapped.lng }));
        }
      });

      showValuesAt(${start.latitude}, ${start.longitude});
    </script>
  </body>
</html>`;
}

export default function CityMap({ onClose, onSelectLocation }: CityMapProps) {
  const { coords, error } = useCurrentCoords();
  const [selected, setSelected] = useState<Coords | null>(null);
  const webViewRef = useRef<WebView>(null);

  // On attend soit une position réelle, soit un échec (permission refusée) avant d'afficher la
  // carte — sinon on ne connaît pas de point de départ ; le clic reste utilisable ensuite dans les
  // deux cas grâce au centre de secours.
  const ready = coords !== null || error !== null;
  const start = coords ?? FALLBACK_CENTER;

  const injectOfflineTraffic = (at: Coords) => {
    if (TOMTOM_API_KEY) return; // La page gère elle-même le trafic via TomTom dans ce cas.
    const traffic = estimateTrafficIntensity(at.latitude, at.longitude);
    webViewRef.current?.injectJavaScript(`window.setTrafficValue(${traffic}); true;`);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const next = JSON.parse(event.nativeEvent.data) as Coords;
      setSelected(next);
      onSelectLocation?.(next);
      injectOfflineTraffic(next);
    } catch {
      // Message inattendu, on l'ignore.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Choisir un lieu</Text>
          <Text style={styles.subtitle}>
            {selected
              ? `${selected.latitude.toFixed(3)}, ${selected.longitude.toFixed(3)}`
              : error ?? 'Touchez la carte pour choisir un point'}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapArea}>
        {ready && (
          <WebView
            ref={webViewRef}
            source={{ html: buildMapHtml(start, coords ? 12 : 5, coords) }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadEnd={() => injectOfflineTraffic(start)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h4,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  closeButton: {
    padding: 4,
  },
  mapArea: {
    flex: 1,
    minHeight: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webview: {
    flex: 1,
  },
});
