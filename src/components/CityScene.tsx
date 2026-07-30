import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import CityPng from '../../assets/images/city.png';
import Car1Png from '../../assets/images/car1.png';
import Car2Png from '../../assets/images/car2.png';
import Car3Png from '../../assets/images/car3.png';
import Car4Png from '../../assets/images/car4.png';
import { Colors } from '../theme';
import { getAQILevel } from '../data/mockData';

// Les images sont dessinées orientées vers la gauche.
const CAR_IMAGES = [Car1Png, Car2Png, Car3Png, Car4Png];

// L'illustration était à l'origine un SVG vectoriel (275 dégradés, >1 Mo) très coûteux à peindre
// pour le navigateur, même sans re-rendu React — d'où le PNG pré-rendu (city.png), bien plus léger.
const CITY_ASPECT_RATIO = 1126 / 392;

// Données statiques provisoires : seront remplacées par des appels API dédiés à chaque paramètre.
const STATIC_DATA = {
  aqi: 78,
  pm25: 22,
  pm10: 38,
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

// --- Pluie ------------------------------------------------------------------

function RainDrop({ left, sceneHeight, clock, phase }: { left: number; sceneHeight: number; clock: Animated.Value; phase: number }) {
  const progress = useMemo(() => Animated.modulo(Animated.add(clock, phase), 1), [clock, phase]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, sceneHeight + 20] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.7, 0] });

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
}: {
  trackWidth: number;
  top: number;
  duration: number;
  delay: number;
  reverse: boolean;
  source: number;
}) {
  const progress = useLoopProgress(duration, delay);
  const puff = useLoopProgress(700, 0);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [trackWidth + 30, -30] : [-30, trackWidth + 30],
  });
  const smokeOpacity = puff.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const smokeScale = puff.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] });

  return (
    <Animated.View style={{ position: 'absolute', top, transform: [{ translateX }] }}>
      {/* Les images sont dessinées orientées vers la gauche : miroir uniquement pour celles qui vont vers la droite. */}
      <View style={{ width: 240, height: 156, transform: [{ scaleX: reverse ? 1 : -1 }] }}>
        <Image source={source} style={{ width: '100%', height: '100%' }} contentFit="contain" />
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 48,
          [reverse ? 'right' : 'left']: -14,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'rgba(110,110,110,0.6)',
          opacity: smokeOpacity,
          transform: [{ scale: smokeScale }],
        }}
      />
    </Animated.View>
  );
}

// -------------------------------------------------------------------------

export default function CityScene({ testTime, layers = DEFAULT_CITY_LAYERS }: CitySceneProps) {
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setCityName('Position indisponible');
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;

        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
        );
        const data = await response.json();
        const name = data.city || data.locality || data.principalSubdivision;
        if (!cancelled) setCityName(name || 'Ville inconnue');
      } catch {
        if (!cancelled) setCityName('Ville inconnue');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
  const pm25Clocks = [pm25ClockA, pm25ClockB, pm25ClockC];
  const pm10Clocks = [pm10ClockA, pm10ClockB, pm10ClockC];
  const rainClocks = [rainClockA, rainClockB];

  const { width, height } = layout;
  const cityHeight = width > 0 ? Math.min(width / CITY_ASPECT_RATIO, height) : 0;
  const timeLabel = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Tailles responsives : plus grandes proportionnellement sur les petits écrans (mobile).
  const timeFontSize = Math.min(64, Math.max(32, width * 0.11));
  const cityFontSize = Math.min(24, Math.max(16, width * 0.05));
  const cityIconSize = Math.min(20, Math.max(14, width * 0.045));

  const sky = getSkyColors(now);
  const night = isNight(now);
  const aqiColor = Colors.aqi[getAQILevel(STATIC_DATA.aqi)];

  const pm25Particles = Array.from({ length: 16 });
  const pm10Particles = Array.from({ length: 8 });
  const raindrops = Array.from({ length: 14 });
  const roadY = height - cityHeight * 0.12;

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
                      <Stop offset="0%" stopColor="#FFF3B0" stopOpacity={0.55} />
                      <Stop offset="100%" stopColor="#FFF3B0" stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={80} cy={80} r={80} fill="url(#ozone)" />
                </Svg>
              )}
              <Ionicons name={night ? 'moon' : 'sunny'} size={90} color={night ? '#E8EDFB' : '#FFE082'} />
            </View>

            {/* Nuages / vent */}
            {layers.weather && (
              <>
                <SwayingCloud top={height * 0.16} left={width * 0.06} size={72} color="rgba(255,255,255,0.9)" duration={4200} />
                <SwayingCloud top={height * 0.3} left={width * 0.42} size={48} color="rgba(255,255,255,0.75)" duration={5000} />
                <SwayingCloud top={height * 0.1} left={width * 0.65} size={56} color="rgba(255,255,255,0.65)" duration={4600} />
              </>
            )}
          </View>

          {/* Image de la ville, toujours calée en bas du container */}
          <View style={[styles.cityLayer, { width, height: cityHeight }]}>
            <Image source={CityPng} style={{ width, height: cityHeight }} contentFit="contain" />
          </View>

          {/* Pluie, au premier plan devant la ville */}
          {layers.weather && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {raindrops.map((_, i) => (
                <RainDrop
                  key={`rain-${i}`}
                  left={(scatter(i, 11) / 100) * width}
                  sceneHeight={height}
                  clock={rainClocks[i % rainClocks.length]}
                  phase={i / raindrops.length}
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
                    <Stop offset="1" stopColor="#8A7A63" stopOpacity={0.35} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={width} height={cityHeight * 0.22} fill="url(#roadHaze)" />
              </Svg>

              <DrivingCar trackWidth={width} top={roadY} duration={7000} delay={0} reverse={false} source={CAR_IMAGES[0]} />
              <DrivingCar trackWidth={width} top={roadY} duration={9000} delay={1500} reverse={true} source={CAR_IMAGES[1]} />
              <DrivingCar trackWidth={width} top={roadY} duration={8000} delay={3000} reverse={false} source={CAR_IMAGES[2]} />
            </View>
          )}

          {/* Surcouche atmosphère */}
          <View style={[StyleSheet.absoluteFill, styles.atmosphere]} pointerEvents="none" />

          {/* Filtre de couleur représentant l'indice de qualité de l'air (vert -> rouge -> violet) */}
          {layers.aqi && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: aqiColor, opacity: 0.2 }]} pointerEvents="none" />
          )}

          {/* Particules fines PM2.5 / PM10, au-dessus des surcouches pour rester bien visibles */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {layers.pm25 &&
              pm25Particles.map((_, i) => (
                <FloatingParticle
                  key={`pm25-${i}`}
                  index={i}
                  size={10 + (i % 3) * 4}
                  color="rgba(70, 75, 85, 0.85)"
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
                  color="rgba(150, 110, 70, 0.8)"
                  sceneWidth={width}
                  sceneHeight={height}
                  clock={pm10Clocks[i % pm10Clocks.length]}
                  phase={i / pm10Particles.length}
                />
              ))}
          </View>

          {/* Badge IQA, premier plan — aligné avec le bloc heure/ville en face */}
          {layers.aqi && (
            <View
              style={[
                styles.aqiBadge,
                { backgroundColor: aqiColor, top: height * 0.1 + 12, right: width * 0.06 + 8 },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.aqiBadgeLabel}>IQA</Text>
              <Text style={styles.aqiBadgeValueText}>{STATIC_DATA.aqi}</Text>
            </View>
          )}

          {/* Premier plan : heure et ville */}
          <View
            style={[
              styles.foreground,
              { top: height * 0.1, left: width * 0.06, marginTop: 12, marginLeft: 8 },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.timeText, { fontSize: timeFontSize }]}>{timeLabel}</Text>
            <View style={styles.cityBadge}>
              <Ionicons name="location" size={cityIconSize} color="#fff" />
              <Text style={[styles.cityText, { fontSize: cityFontSize }]} numberOfLines={1}>{cityName}</Text>
            </View>
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
    position: 'absolute',
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
  foreground: {
    position: 'absolute',
    top: 16,
    left: 16,
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
