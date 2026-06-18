import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import "../global.css";

import SplashLoader from '@/components/SplashLoader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Empêche le splash natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function AppNavigator() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { scheme, isDark, colors } = useTheme();
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
          if (isAuthenticated) {
            router.replace(user?.status === 'active' ? '/(tabs)' : ('/(auth)/verify-otp' as any));
          } else {
            router.replace('/(auth)/login' as any);
          }
        }
      }, 2000);
    }
    prepare();
  }, [fontsLoaded]);

  // Redirection après authLoading résolu (si le splash est déjà terminé)
  useEffect(() => {
    if (splashDone && !authLoading) {
      if (isAuthenticated) {
        router.replace(user?.status === 'active' ? '/(tabs)' : ('/(auth)/verify-otp' as any));
      } else {
        router.replace('/(auth)/login' as any);
      }
    }
  }, [authLoading, isAuthenticated, splashDone, user]);

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
            <Stack.Screen name="annonces/[id]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="annonces/booking" options={{ 
              title: 'Réservation', 
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: 'Montserrat_700Bold', fontSize: 17 },
              headerShadowVisible: false,
              headerBackTitle: '',
            }} />
            <Stack.Screen name="annonces/payment" options={{ 
              title: 'Confirmation', 
              presentation: 'card',
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: 'Montserrat_700Bold', fontSize: 17 },
              headerShadowVisible: false,
              headerBackTitle: '',
            }} />
            <Stack.Screen name="annonces/directions" options={{ headerShown: false, presentation: 'modal' }} />
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
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
