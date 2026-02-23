import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import "../global.css";

import SplashLoader from '@/components/SplashLoader';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Empêche le splash natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    PumpDemiBold: require('../assets/fonts/Pump_Demi_Bold_LET_Plain.ttf'),
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;
      try {
        // Autres chargements initiaux ici si besoin
      } finally {
        await SplashScreen.hideAsync();
        setTimeout(() => setShowSplash(false), 8000);
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (showSplash || !fontsLoaded) {
    return <SplashLoader />;
  }

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
