import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Polygon } from 'react-native-svg';
import CityPng from '../../assets/images/city.png';
import NaturePng from '../../assets/images/nature.png';
import Car1Png from '../../assets/images/car1.png';
import Car2Png from '../../assets/images/car2.png';
import Car3Png from '../../assets/images/car3.png';
import Car4Png from '../../assets/images/car4.png';
import { Colors } from '../theme';
import { getAQILevel } from '../data/mockData';
import { useCurrentCoords, Coords } from '../hooks/useCurrentCoords';
import { findNearestCityName } from '../services/offlineGeocoding';
import { getBiome } from '../services/biome';

// Les images sont dessinées orientées vers la gauche.
const CAR_IMAGES = [Car1Png, Car2Png, Car3Png, Car4Png];
// Ratio du pavé dans lequel chaque image est affichée (contentFit="contain"), pas celui du PNG
// lui-même : les 4 images n'ont pas toutes le même ratio, ce pavé sert juste de cadre commun.
const CAR_ASPECT_RATIO = 240 / 156;
// Nombre de voitures affichées à intensité de trafic maximale.
const MAX_CARS = 8;

// L'illustration était à l'origine un SVG vectoriel (275 dégradés, >1 Mo) très coûteux à peindre
// pour le navigateur, même sans re-rendu React — d'où le PNG pré-rendu (city.png), bien plus léger.
const CITY_ASPECT_RATIO = 1126 / 392;

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface CityIntensity {
  aqi: number;
  pm25: number;
  pm10: number;
  traffic: number;
  ozone: number;
  weather: WeatherCondition;
}

// Données provisoires : seront remplacées par des appels API dédiés à chaque paramètre.
export const DEFAULT_CITY_INTENSITY: CityIntensity = {
  aqi: 78,
  pm25: 22,
  pm10: 38,
  traffic: 60,
  ozone: 90,
  weather: 'rainy',
};

export interface CityLayers {
  aqi: boolean;
  pm25: boolean;
  pm10: boolean;
  traffic: boolean;
  ozone: boolean;
  weather: boolean;
}

export const DEFAULT_CITY_LAYERS: CityLayers = {
  aqi: true,
  pm25: true,
  pm10: true,
  traffic: true,
  ozone: true,
  weather: true,
};

interface CitySceneProps {
  /** Permet d'imposer une heure fixe (pour tester visuellement le rendu) au lieu de l'heure réelle. */
  testTime?: Date;
  /** Paramètres visuels de pollution/météo à afficher sur la scène. */
  layers?: CityLayers;
  /** Niveau d'intensité de chaque paramètre (valeur, densité, ou type de météo). */
  intensity?: CityIntensity;
  /** Impose un lieu (ex. choisi sur la carte) au lieu de la géolocalisation réelle de l'appareil. */
  locationOverride?: Coords;
  /** Décalage UTC du lieu affiché, en minutes, pour que l'heure/le ciel suivent son fuseau horaire. */
  locationTimezoneOffsetMinutes?: number;
}

// --- Cycle jour / nuit -------------------------------------------------

interface SkyKeyframe {
  hour: number;
  top: string;
  mid: string;
  bottom: string;
}

const SKY_KEYFRAMES: SkyKeyframe[] = [
  { hour: 0, top: '#0B1026', mid: '#141B3C', bottom: '#1E2A4A' }, // nuit
  { hour: 5, top: '#0B1026', mid: '#141B3C', bottom: '#1E2A4A' }, // nuit
  { hour: 6.5, top: '#355C8C', mid: '#E8946B', bottom: '#FBCB86' }, // lever du soleil
  { hour: 8, top: '#2E7DD1', mid: '#6CB4EE', bottom: '#BEE3F8' }, // jour
  { hour: 17.5, top: '#2E7DD1', mid: '#6CB4EE', bottom: '#BEE3F8' }, // jour
  { hour: 19, top: '#4A3F7A', mid: '#E1795D', bottom: '#F7A560' }, // coucher du soleil
  { hour: 21, top: '#0B1026', mid: '#141B3C', bottom: '#1E2A4A' }, // nuit
  { hour: 24, top: '#0B1026', mid: '#141B3C', bottom: '#1E2A4A' }, // nuit
];

// Le soleil est visible entre ces deux heures ; en dehors, c'est la lune (bascule directe, sans fondu).
const SUN_START_HOUR = 6.5;
const SUN_END_HOUR = 19;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
}

function getHourOfDay(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

export function getSkyColors(date: Date) {
  const hour = getHourOfDay(date);
  for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
    const a = SKY_KEYFRAMES[i];
    const b = SKY_KEYFRAMES[i + 1];
    if (hour >= a.hour && hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      return { top: lerpColor(a.top, b.top, t), mid: lerpColor(a.mid, b.mid, t), bottom: lerpColor(a.bottom, b.bottom, t) };
    }
  }
  return { top: SKY_KEYFRAMES[0].top, mid: SKY_KEYFRAMES[0].mid, bottom: SKY_KEYFRAMES[0].bottom };
}

function isNight(date: Date) {
  const hour = getHourOfDay(date);
  return hour < SUN_START_HOUR || hour >= SUN_END_HOUR;
}

// Dispersion pseudo-aléatoire mais stable (nombre d'or), pour ne pas faire "sauter" les éléments à chaque rendu.
function scatter(index: number, salt: number) {
  return ((index * 137.508 + salt) % 100 + 100) % 100;
}

// Boucle une valeur 0 -> 1 indéfiniment, en relançant nous-mêmes l'animation à chaque fin de
// cycle plutôt que de passer par `Animated.loop`. Sur react-native-web, `Animated.loop` d'un
// simple `Animated.timing` en `useNativeDriver: true` ne s'exécute qu'une seule fois : le nombre
// d'itérations n'est utilisé que par le vrai pilote natif (absent sur le web), qui bascule
// silencieusement sur une exécution JS classique ne connaissant pas ce paramètre.
function useLoopProgress(duration: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      if (!active) return;
      value.setValue(0);
      Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }).start(() => {
        if (active) runCycle();
      });
    };

    timeoutId = setTimeout(runCycle, delay);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      value.stopAnimation();
    };
  }, [value, duration, delay]);

  return value;
}

// --- Particules flottantes (PM2.5 / PM10) -------------------------------
//
// Toutes les particules d'un même groupe partagent quelques horloges communes (voir
// `useLoopProgress` dans CityScene) au lieu d'avoir chacune leur propre minuteur JS : avec des
// dizaines de particules, autant de minuteurs indépendants finissaient par saturer le thread JS
// (l'animation semblait tourner au ralenti). Le déphasage de chaque particule sur son horloge se
// fait via `Animated.modulo`, ce qui ne coûte quasiment rien à calculer.
//
// Les particules sont toujours visibles (pas d'apparition/disparition en fondu) : chacune se
// balade en continu entre plusieurs points aléatoires (mais stables) tirés au sort à l'intérieur
// du composant, sans jamais en dépasser les bords. Le dernier point rejoint le premier pour que
// la boucle soit continue, sans saut au retour à 0.
const PARTICLE_WAYPOINTS = 5;

function buildWaypoints(index: number, size: number, boxWidth: number, boxHeight: number) {
  const marginX = size / 2 + 4;
  const marginY = size / 2 + 4;
  const points: { x: number; y: number }[] = [];
  for (let k = 0; k < PARTICLE_WAYPOINTS; k++) {
    const x = marginX + (scatter(index, 13 + k * 29) / 100) * Math.max(boxWidth - marginX * 2, 1);
    const y = marginY + (scatter(index, 47 + k * 53) / 100) * Math.max(boxHeight - marginY * 2, 1);
    points.push({ x, y });
  }
  points.push(points[0]);
  return points;
}

interface ParticleProps {
  index: number;
  size: number;
  color: string;
  sceneWidth: number;
  sceneHeight: number;
  clock: Animated.Value;
  phase: number;
}

function FloatingParticle({ index, size, color, sceneWidth, sceneHeight, clock, phase }: ParticleProps) {
  // Dérivé mémoïsé : `clock` (stable, voir useLoopProgress) et `phase` ne changent jamais après le
  // premier rendu, donc ce nœud Animated n'est construit qu'une seule fois par particule au lieu
  // d'être recréé (et de se réabonner à l'horloge) à chaque re-rendu de CityScene.
  const progress = useMemo(() => Animated.modulo(Animated.add(clock, phase), 1), [clock, phase]);
  const waypoints = buildWaypoints(index, size, sceneWidth, sceneHeight);
  const inputRange = waypoints.map((_, k) => k / (waypoints.length - 1));
  const translateX = progress.interpolate({ inputRange, outputRange: waypoints.map((p) => p.x) });
  const translateY = progress.interpolate({ inputRange, outputRange: waypoints.map((p) => p.y) });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

// --- Précipitations (pluie / neige) ------------------------------------------

function Precipitation({
  left,
  sceneHeight,
  clock,
  phase,
  variant,
}: {
  left: number;
  sceneHeight: number;
  clock: Animated.Value;
  phase: number;
  variant: 'rain' | 'snow';
}) {
  const progress = useMemo(() => Animated.modulo(Animated.add(clock, phase), 1), [clock, phase]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, sceneHeight + 20] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.8, 0.8, 0] });

  if (variant === 'snow') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          left,
          top: 0,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          opacity,
          transform: [{ translateY }],
        }}
      />
    );
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: 2,
        height: 12,
        borderRadius: 1,
        backgroundColor: 'rgba(190, 210, 255, 0.8)',
        opacity,
        transform: [{ translateY }, { rotate: '12deg' }],
      }}
    />
  );
}

// --- Vent (balancement des nuages) -----------------------------------------

function SwayingCloud({ top, left, size, color, duration }: { top: number; left: number; size: number; color: string; duration: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [progress, duration]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <Animated.View style={{ position: 'absolute', top, left, transform: [{ translateX }] }}>
      <Ionicons name="cloud" size={size} color={color} />
    </Animated.View>
  );
}

// --- Circulation automobile -------------------------------------------------

function DrivingCar({
  trackWidth,
  top,
  duration,
  delay,
  reverse,
  source,
  carWidth,
  carHeight,
}: {
  trackWidth: number;
  top: number;
  duration: number;
  delay: number;
  reverse: boolean;
  source: number;
  carWidth: number;
  carHeight: number;
}) {
  const progress = useLoopProgress(duration, delay);
  const puff = useLoopProgress(700, 0);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [trackWidth + 30, -30] : [-30, trackWidth + 30],
  });
  const smokeOpacity = puff.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] });
  const smokeScale = puff.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] });

  // La voiture est calée en bas de sa boîte (contentPosition="bottom"), donc la fumée se positionne
  // aussi depuis le bas (près du pot d'échappement), pas depuis le haut de la boîte.
  const smokeSize = carHeight * 0.16;
  const smokeBottom = carHeight * 0.06;
  const smokeOffset = -(carHeight * 0.04);

  return (
    // `top` désigne la ligne de route : on remonte le pavé de la hauteur de la voiture pour que
    // ce soit son bas (les roues), et non son coin haut-gauche, qui repose sur cette ligne.
    <Animated.View style={{ position: 'absolute', top: top - carHeight, transform: [{ translateX }] }}>
      {/* Les images sont dessinées orientées vers la gauche : miroir uniquement pour celles qui vont vers la droite. */}
      <View style={{ width: carWidth, height: carHeight, transform: [{ scaleX: reverse ? 1 : -1 }] }}>
        <Image
          source={source}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          contentPosition="bottom"
        />
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: smokeBottom,
          [reverse ? 'right' : 'left']: smokeOffset,
          width: smokeSize,
          height: smokeSize,
          borderRadius: smokeSize / 2,
          backgroundColor: 'rgba(190, 190, 195, 0.95)',
          opacity: smokeOpacity,
          transform: [{ scale: smokeScale }],
        }}
      />
    </Animated.View>
  );
}

// --- Océan (vagues animées) -------------------------------------------------
//
// Remplace city.png/nature.png quand le lieu affiché est en mer (voir services/biome.ts).
// Chaque "vague" est un polygone SVG dont le bord supérieur suit une sinusoïde, dessiné sur un
// canevas large d'exactement une longueur d'onde de plus que la largeur visible ; en le faisant
// défiler de 0 à -wavelength (une période complète) puis en relançant la boucle, le motif se
// raccorde parfaitement, sans saut visible au redémarrage. Plusieurs vagues superposées (couleur,
// amplitude, longueur d'onde et vitesse différentes) donnent un effet de profondeur.
function buildWavePoints(canvasWidth: number, height: number, amplitude: number, wavelength: number, baseY: number) {
  const step = 12;
  const points: string[] = [];
  for (let x = 0; x <= canvasWidth; x += step) {
    const y = baseY + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
    points.push(`${x},${y}`);
  }
  points.push(`${canvasWidth},${height}`);
  points.push(`0,${height}`);
  return points.join(' ');
}

function WaveLayer({
  width,
  height,
  color,
  amplitude,
  wavelength,
  baseY,
  duration,
  delay = 0,
  opacity = 1,
}: {
  width: number;
  height: number;
  color: string;
  amplitude: number;
  wavelength: number;
  baseY: number;
  duration: number;
  delay?: number;
  opacity?: number;
}) {
  const progress = useLoopProgress(duration, delay);
  const canvasWidth = width + wavelength;
  const points = useMemo(
    () => buildWavePoints(canvasWidth, height, amplitude, wavelength, baseY),
    [canvasWidth, height, amplitude, wavelength, baseY]
  );
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -wavelength] });

  return (
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX }] }}>
      <Svg width={canvasWidth} height={height}>
        <Polygon points={points} fill={color} opacity={opacity} />
      </Svg>
    </Animated.View>
  );
}

function OceanWaves({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: '#0F4C68' }}>
      <WaveLayer
        width={width}
        height={height}
        color="#8ED2E0"
        amplitude={height * 0.05}
        wavelength={Math.max(80, width * 0.5)}
        baseY={height * 0.22}
        duration={7000}
        opacity={0.75}
      />
      <WaveLayer
        width={width}
        height={height}
        color="#4FA8C9"
        amplitude={height * 0.07}
        wavelength={Math.max(70, width * 0.38)}
        baseY={height * 0.4}
        duration={5000}
        delay={300}
        opacity={0.85}
      />
      <WaveLayer
        width={width}
        height={height}
        color="#1E6E96"
        amplitude={height * 0.09}
        wavelength={Math.max(60, width * 0.3)}
        baseY={height * 0.58}
        duration={3600}
        delay={600}
      />
    </View>
  );
}

// -------------------------------------------------------------------------

export default function CityScene({
  testTime,
  layers = DEFAULT_CITY_LAYERS,
  intensity = DEFAULT_CITY_INTENSITY,
  locationOverride,
  locationTimezoneOffsetMinutes,
}: CitySceneProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Heure affichée au premier plan. Par défaut l'heure réelle, mise à jour chaque minute ;
  // passer `testTime` permet de la figer pour vérifier visuellement le rendu.
  const [now, setNow] = useState<Date>(() => testTime ?? new Date());

  const [cityName, setCityName] = useState<string>('Localisation…');

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  useEffect(() => {
    if (testTime) {
      setNow(testTime);
      return;
    }
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [testTime]);

  const { coords: gpsCoords, error: locationError } = useCurrentCoords();
  const coords = locationOverride ?? gpsCoords;

  // Décor de fond selon le lieu : ville, nature ou océan (voir services/biome.ts). Par défaut
  // "ville" tant que la position n'est pas encore connue, pour garder le rendu initial habituel.
  const biome = useMemo(
    () => (coords ? getBiome(coords.latitude, coords.longitude) : 'ville'),
    [coords]
  );

  useEffect(() => {
    if (!coords) {
      if (locationError && !locationOverride) setCityName(locationError);
      return;
    }
    // Recherche locale (aucun appel réseau) : voir services/offlineGeocoding.ts.
    setCityName(findNearestCityName(coords.latitude, coords.longitude));
  }, [coords, locationError, locationOverride]);

  // Quelques horloges partagées (durées variées pour ne pas tout synchroniser) plutôt qu'un
  // minuteur indépendant par particule/goutte — voir le commentaire sur `useLoopProgress`.
  const pm25ClockA = useLoopProgress(32000);
  const pm25ClockB = useLoopProgress(38000);
  const pm25ClockC = useLoopProgress(44000);
  const pm10ClockA = useLoopProgress(44000);
  const pm10ClockB = useLoopProgress(52000);
  const pm10ClockC = useLoopProgress(60000);
  const rainClockA = useLoopProgress(900);
  const rainClockB = useLoopProgress(1150);
  const snowClockA = useLoopProgress(2600);
  const snowClockB = useLoopProgress(3200);
  const pm25Clocks = [pm25ClockA, pm25ClockB, pm25ClockC];
  const pm10Clocks = [pm10ClockA, pm10ClockB, pm10ClockC];
  const rainClocks = [rainClockA, rainClockB];
  const snowClocks = [snowClockA, snowClockB];

  // Décale `now` sur le fuseau horaire du lieu affiché (si fourni), pour que l'heure, le ciel et
  // le cycle jour/nuit correspondent à ce lieu plutôt qu'à celui de l'appareil. Continue de défiler
  // en temps réel puisqu'il ne fait que décaler `now`, qui lui-même tique toutes les 60s.
  let displayNow = now;
  if (locationTimezoneOffsetMinutes !== undefined) {
    const deviceOffsetMinutes = -now.getTimezoneOffset();
    const diffMs = (locationTimezoneOffsetMinutes - deviceOffsetMinutes) * 60000;
    displayNow = new Date(now.getTime() + diffMs);
  }

  const { width, height } = layout;
  const cityHeight = width > 0 ? Math.min(width / CITY_ASPECT_RATIO, height) : 0;
  const timeLabel = displayNow.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Tailles responsives : plus grandes proportionnellement sur les petits écrans (mobile).
  const timeFontSize = Math.min(64, Math.max(32, width * 0.11));
  const cityFontSize = Math.min(24, Math.max(16, width * 0.05));
  const cityIconSize = Math.min(20, Math.max(14, width * 0.045));

  const sky = getSkyColors(displayNow);
  const night = isNight(displayNow);
  const aqiColor = Colors.aqi[getAQILevel(intensity.aqi)];

  // Densité des particules proportionnelle à la concentration réglée (échelles usuelles PM2.5/PM10).
  const pm25Count = Math.round(Math.min(40, Math.max(4, (intensity.pm25 / 150) * 40)));
  const pm10Count = Math.round(Math.min(18, Math.max(2, (intensity.pm10 / 200) * 18)));
  const pm25Particles = Array.from({ length: pm25Count });
  const pm10Particles = Array.from({ length: pm10Count });
  const precipitationDrops = Array.from({ length: 14 });

  // Trafic : plus l'intensité est élevée, plus il y a de voitures sur la route (densité, pas
  // vitesse) et plus la brume au sol (NO2/CO) est marquée.
  const trafficFactor = Math.min(1, Math.max(0, intensity.traffic / 100));
  const roadHazeOpacity = 0.12 + trafficFactor * 0.4;
  const carCount = Math.round(trafficFactor * MAX_CARS);
  const cars = Array.from({ length: carCount }, (_, i) => ({
    reverse: i % 2 === 0,
    source: CAR_IMAGES[i % CAR_IMAGES.length],
    duration: 7000 + (i % 3) * 1000,
    delay: i * 1300,
  }));

  // Ozone : intensifie le halo autour du soleil.
  const ozoneFactor = Math.min(1, Math.max(0.15, intensity.ozone / 240));

  // Météo : le type choisi détermine nuages/pluie/neige (aucun effet si "ensoleillé").
  const precipitationVariant: 'rain' | 'snow' | null =
    intensity.weather === 'rainy' ? 'rain' : intensity.weather === 'snowy' ? 'snow' : null;
  const precipitationClocks = precipitationVariant === 'snow' ? snowClocks : rainClocks;
  const showClouds = intensity.weather !== 'sunny';

  // Les roues des voitures reposent sur le tout bas du composant, comme l'image de la ville
  // (`styles.cityLayer` a déjà `bottom: 0`).
  const roadY = height;

  // Taille des voitures proportionnelle à la ville (donc au composant), avec un plancher/plafond
  // pour rester lisible sur petit écran et raisonnable sur grand écran.
  const carHeight = Math.min(220, Math.max(70, cityHeight * 0.40));
  const carWidth = carHeight * CAR_ASPECT_RATIO;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && height > 0 && (
        <>
          {/* Fond ciel, dynamique selon l'heure */}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={sky.top} />
                <Stop offset="0.6" stopColor={sky.mid} />
                <Stop offset="1" stopColor={sky.bottom} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill="url(#sky)" />
          </Svg>

          {/* Couche soleil (+ halo d'ozone) / lune */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.sunWrapper, { top: height * 0.08, right: width * 0.14 }]}>
              {layers.ozone && !night && (
                <Svg width={160} height={160} style={styles.ozoneHalo}>
                  <Defs>
                    <RadialGradient id="ozone" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%" stopColor="#FFF3B0" stopOpacity={0.55 * ozoneFactor} />
                      <Stop offset="100%" stopColor="#FFF3B0" stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={80} cy={80} r={80} fill="url(#ozone)" />
                </Svg>
              )}
              <Ionicons name={night ? 'moon' : 'sunny'} size={90} color={night ? '#E8EDFB' : '#FFE082'} />
            </View>

            {/* Nuages / vent */}
            {layers.weather && showClouds && (
              <>
                <SwayingCloud top={height * 0.16} left={width * 0.06} size={72} color="rgba(255,255,255,0.9)" duration={4200} />
                <SwayingCloud top={height * 0.3} left={width * 0.42} size={48} color="rgba(255,255,255,0.75)" duration={5000} />
                <SwayingCloud top={height * 0.1} left={width * 0.65} size={56} color="rgba(255,255,255,0.65)" duration={4600} />
              </>
            )}
          </View>

          {/* Décor de fond, toujours calé en bas du container : ville, nature ou océan (vagues animées) */}
          <View style={[styles.cityLayer, { width, height: cityHeight }]}>
            {biome === 'ocean' ? (
              <OceanWaves width={width} height={cityHeight} />
            ) : (
              <Image
                source={biome === 'nature' ? NaturePng : CityPng}
                style={{ width, height: cityHeight }}
                contentFit="contain"
              />
            )}
          </View>

          {/* Pluie ou neige, au premier plan devant la ville */}
          {layers.weather && precipitationVariant && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {precipitationDrops.map((_, i) => (
                <Precipitation
                  key={`precip-${i}`}
                  left={(scatter(i, 11) / 100) * width}
                  sceneHeight={height}
                  clock={precipitationClocks[i % precipitationClocks.length]}
                  phase={i / precipitationDrops.length}
                  variant={precipitationVariant}
                />
              ))}
            </View>
          )}

          {/* Circulation automobile : voitures, fumée d'échappement, brume de pollution au sol */}
          {layers.traffic && cityHeight > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width={width} height={cityHeight * 0.22} style={{ position: 'absolute', left: 0, top: height - cityHeight * 0.22 }}>
                <Defs>
                  <LinearGradient id="roadHaze" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#8A7A63" stopOpacity={0} />
                    <Stop offset="1" stopColor="#8A7A63" stopOpacity={roadHazeOpacity} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={width} height={cityHeight * 0.22} fill="url(#roadHaze)" />
              </Svg>

              {cars.map((car, i) => (
                <DrivingCar
                  key={i}
                  trackWidth={width}
                  top={roadY}
                  duration={car.duration}
                  delay={car.delay}
                  reverse={car.reverse}
                  source={car.source}
                  carWidth={carWidth}
                  carHeight={carHeight}
                />
              ))}
            </View>
          )}

          {/* Surcouche atmosphère */}
          <View style={[StyleSheet.absoluteFill, styles.atmosphere]} pointerEvents="none" />

          {/* Filtre de couleur représentant l'indice de qualité de l'air (vert -> rouge -> violet) */}
          {layers.aqi && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: aqiColor, opacity: 0.1 }]} pointerEvents="none" />
          )}

          {/* Particules fines PM2.5 / PM10, au-dessus des surcouches pour rester bien visibles */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {layers.pm25 &&
              pm25Particles.map((_, i) => (
                <FloatingParticle
                  key={`pm25-${i}`}
                  index={i}
                  size={10 + (i % 3) * 4}
                  color="rgba(70, 75, 85, 0.4)"
                  sceneWidth={width}
                  sceneHeight={height}
                  clock={pm25Clocks[i % pm25Clocks.length]}
                  phase={i / pm25Particles.length}
                />
              ))}
            {layers.pm10 &&
              pm10Particles.map((_, i) => (
                <FloatingParticle
                  key={`pm10-${i}`}
                  index={i + 1000}
                  size={18 + (i % 3) * 6}
                  color="rgba(150, 110, 70, 0.4)"
                  sceneWidth={width}
                  sceneHeight={height}
                  clock={pm10Clocks[i % pm10Clocks.length]}
                  phase={i / pm10Particles.length}
                />
              ))}
          </View>

          {/* Premier plan : heure, ville et IQA dans un même bloc pour qu'ils restent toujours alignés entre eux */}
          <View
            style={[
              styles.foregroundRow,
              { top: height * 0.1 + 12, left: width * 0.06 + 8, right: width * 0.06 + 8 },
            ]}
            pointerEvents="none"
          >
            <View>
              <Text style={[styles.timeText, { fontSize: timeFontSize }]}>{timeLabel}</Text>
              <View style={styles.cityBadge}>
                <Ionicons name="location" size={cityIconSize} color="#fff" />
                <Text style={[styles.cityText, { fontSize: cityFontSize }]} numberOfLines={1}>{cityName}</Text>
              </View>
            </View>

            {layers.aqi && (
              <View style={[styles.aqiBadge, { backgroundColor: aqiColor }]}>
                <Text style={styles.aqiBadgeLabel}>IQA</Text>
                <Text style={styles.aqiBadgeValueText}>{Math.round(intensity.aqi)}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  sunWrapper: {
    position: 'absolute',
    width: 90,
    height: 90,
  },
  ozoneHalo: {
    position: 'absolute',
    top: -35,
    left: -35,
  },
  cityLayer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  atmosphere: {
    backgroundColor: 'rgba(210, 200, 190, 0.22)',
  },
  aqiBadge: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  aqiBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  aqiBadgeValueText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 34,
  },
  foregroundRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
