import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CityScene, { getSkyColors, DEFAULT_CITY_LAYERS, CityLayers } from '../components/CityScene';
import CityLayersPanel from '../components/CityLayersPanel';
import { Spacing } from '../theme';

const DESKTOP_BREAKPOINT = 768;

export default function CityScreen() {
  const [layers, setLayers] = useState<CityLayers>(DEFAULT_CITY_LAYERS);
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const skyTop = getSkyColors(new Date()).top;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: skyTop }]} edges={['top']}>
      <StatusBar style="light" />

      <View style={[styles.content, isDesktop && styles.contentRow]}>
        <View style={[styles.sceneSection, isDesktop && styles.sceneSectionRow]}>
          <CityScene layers={layers} />
        </View>

        <View style={[styles.controlsSection, isDesktop && styles.controlsSectionRow]}>
          <CityLayersPanel value={layers} onChange={setLayers} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  contentRow: {
    flexDirection: 'row',
  },
  sceneSection: {
    flex: 1.4,
  },
  sceneSectionRow: {
    flex: 1.6,
  },
  controlsSection: {
    padding: Spacing.md,
  },
  controlsSectionRow: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
});
