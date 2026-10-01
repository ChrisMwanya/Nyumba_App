import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { getLogo } from '@/constants/branding';
import { useTheme } from '@/contexts/ThemeContext';

export default function SplashLoader() {
  const { colors, isDark } = useTheme();

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Logo accordé au fond : bleu nuit en clair, blanc en sombre.
  const logo = getLogo(isDark);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      <Image source={logo} className="h-64 w-64" resizeMode="contain" />

      <View className="h-12 w-12 items-center justify-center">
        <Animated.View
          className="h-11 w-11 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: colors.teal,
            transform: [{ rotate }],
          }}
        />
      </View>

      <Text
        style={{ color: colors.textMuted }}
        className="absolute bottom-10 text-xs tracking-widest"
      >
        By TipTechEnergie
      </Text>
    </View>
  );
}
