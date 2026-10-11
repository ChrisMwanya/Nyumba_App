import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
  useFonts,
} from '@expo-google-fonts/google-sans';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import SplashLoader from '@/components/SplashLoader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import {
  PreferencesProvider,
  usePreferences,
} from '@/contexts/PreferencesContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Empêche le splash natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function AppNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReady: preferencesReady, preferences } = usePreferences();
  const onboardingDone = preferences !== null;
  const { scheme, isDark, colors } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PumpDemiBold: require('../assets/fonts/Pump_Demi_Bold_LET_Plain.ttf'),
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;
      await SplashScreen.hideAsync();
      setTimeout(() => setSplashDone(true), 2000);
    }
    prepare();
  }, [fontsLoaded]);

  // Redirection une fois le splash terminé, la session et les préférences chargées.
  // Première connexion (aucune préférence enregistrée) : onboarding.
  useEffect(() => {
    if (!splashDone || authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login' as any);
      return;
    }
    if (!preferencesReady) return;
    router.replace(onboardingDone ? '/(tabs)' : ('/onboarding' as any));
  }, [
    authLoading,
    isAuthenticated,
    splashDone,
    preferencesReady,
    onboardingDone,
  ]);

  if (!splashDone || !fontsLoaded) {
    return <SplashLoader />;
  }

  return (
    <SafeAreaProvider>
      <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="annonces/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="annonces/directions"
              options={{ headerShown: false, presentation: 'modal' }}
            />
          </Stack>
          <StatusBar style={colors.statusBar} />
        </GestureHandlerRootView>
      </NavThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <FavoritesProvider>
            <AppNavigator />
          </FavoritesProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
