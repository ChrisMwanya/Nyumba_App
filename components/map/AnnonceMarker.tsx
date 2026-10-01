import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import {
  CATEGORY_INK,
  getCategoryColor,
  getCategoryIcon,
} from '@/constants/categories';
import type { Annonce } from '@/services/annonceService';

type Props = {
  annonce: Annonce;
  selected: boolean;
  onPress: () => void;
};

/** Épingle d'annonce : pastille colorée par catégorie + pointe vers le lieu. */
export default function AnnonceMarker({ annonce, selected, onPress }: Props) {
  const slug = annonce.category?.slug;
  const tint = getCategoryColor(slug);
  const size = selected ? 48 : 38;

  return (
    <Pressable onPress={onPress} hitSlop={8} className="items-center">
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint,
          // Anneau blanc, comme les épingles de la landing
          borderColor: selected ? CATEGORY_INK : '#FFFFFF',
          borderWidth: 3,
        }}
        className="items-center justify-center"
      >
        <Ionicons
          name={getCategoryIcon(slug ?? '')}
          size={selected ? 24 : 18}
          color={CATEGORY_INK}
        />
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
          borderTopColor: tint,
          marginTop: -1,
        }}
      />
    </Pressable>
  );
}
