import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, useColorScheme, View } from 'react-native';

export default function SplashLoader() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logo = require('../assets/images/splash-icon-light.png')
    

  return (
    <View className="flex-1 items-center justify-center gap-10 bg-primary">
      <Image source={logo} className="w-96 h-96" resizeMode="cover" />

      <View className="w-12 h-12 items-center justify-center">
        <Animated.View
          className="w-11 h-11 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: '#ffffff',
            transform: [{ rotate }],
          }}
        />
      </View>

      <Text className="absolute bottom-10 text-xs tracking-widest text-white/60">
        By TipTechEnergie
      </Text>
    </View>
  );
}
