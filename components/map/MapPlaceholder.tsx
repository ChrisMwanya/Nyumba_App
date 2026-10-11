import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

/** Affiché à la place de la carte quand `EXPO_PUBLIC_MAPBOX_TOKEN` manque. */
export default function MapPlaceholder() {
  const { colors } = useTheme();

  return (
    <View
      style={{ backgroundColor: colors.surfaceElevated }}
      className="flex-1 items-center justify-center px-10"
    >
      <View
        style={{ backgroundColor: colors.surface }}
        className="mb-6 h-20 w-20 items-center justify-center rounded-full"
      >
        <Ionicons name="map-outline" size={36} color={colors.icon} />
      </View>
      <Text style={{ color: colors.text }} className="font-body-bold text-lg">
        Carte indisponible
      </Text>
      <Text
        style={{ color: colors.textMuted }}
        className="mt-2 text-center font-body text-sm"
      >
        Ajoutez votre jeton Mapbox dans le fichier .env
        {'\n'}
        (EXPO_PUBLIC_MAPBOX_TOKEN) puis relancez l&apos;application.
      </Text>
    </View>
  );
}
