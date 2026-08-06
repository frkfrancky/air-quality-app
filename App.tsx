import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import MapScreen from './src/screens/MapScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ArduinoScreen from './src/screens/ArduinoScreen';
import CityScreen from './src/screens/CityScreen';
import { Colors } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              Accueil: ['home', 'home-outline'],
              Carte: ['map', 'map-outline'],
              Statistiques: ['bar-chart', 'bar-chart-outline'],
              Arduino: ['hardware-chip', 'hardware-chip-outline'],
              Ville: ['business', 'business-outline'],
              Paramètres: ['settings', 'settings-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['help', 'help-outline'];
            return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textLight,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 4 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 82 : 64,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        })}
      >
        {/* <Tab.Screen name="Accueil" component={DashboardScreen} /> */}
        {/* <Tab.Screen name="Carte" component={MapScreen} /> */}
        {/* <Tab.Screen name="Statistiques" component={StatsScreen} /> */}
       
        <Tab.Screen name="Ville" component={CityScreen} />
        <Tab.Screen name="Arduino" component={ArduinoScreen} />
        <Tab.Screen name="Paramètres" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
