import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, View } from 'react-native';

import { FloatShadow, Tiles } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const SIZE = 44;

type Props = {
  avatarUrl?: string | null;
  label: string;
};

/** Repère de l'utilisateur : son avatar, surmonté d'une étiquette « Vous ». */
export default function UserMarker({ avatarUrl, label }: Props) {
  const { colors } = useTheme();

  return (
    <View className="items-center" pointerEvents="none">
      <View
        style={{ backgroundColor: colors.cta, ...FloatShadow }}
        className="mb-1 rounded-full px-2.5 py-1"
      >
        <Text
          style={{ color: colors.ctaText }}
          className="font-body-bold text-[11px]"
        >
          {label}
        </Text>
      </View>

      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: Tiles.lilac,
          // Anneau teal : distingue l'utilisateur des épingles d'annonces,
          // cerclées de blanc.
          borderColor: colors.teal,
          borderWidth: 3,
        }}
        className="items-center justify-center overflow-hidden"
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="person" size={20} color={colors.ink} />
        )}
      </View>

      {/* Pointe du repère, alignée sur la coordonnée exacte */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.teal,
          marginTop: -1,
        }}
      />
    </View>
  );
}
