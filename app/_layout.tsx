import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import "../global.css";

import SplashLoader from '@/components/SplashLoader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Empêche le splash natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(auth)',
};

function AppNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PumpDemiBold: require('../assets/fonts/Pump_Demi_Bold_LET_Plain.ttf'),
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;
      await SplashScreen.hideAsync();
      setTimeout(() => {
        setSplashDone(true);
        if (!authLoading) {
          router.replace(isAuthenticated ? '/(tabs)' : ('/(auth)/login' as any));
        }
      }, 2000);
    }
    prepare();
  }, [fontsLoaded]);

  // Redirection après authLoading résolu (si le splash est déjà terminé)
  useEffect(() => {
    if (splashDone && !authLoading) {
      router.replace(isAuthenticated ? '/(tabs)' : ('/(auth)/login' as any));
    }
  }, [authLoading, isAuthenticated, splashDone]);

  if (!splashDone || !fontsLoaded) {
    return <SplashLoader />;
  }

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

