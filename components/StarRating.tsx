import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

/** Jaune des étoiles : lisible sur fond clair comme sombre. */
export const STAR_COLOR = '#F9AB00';

const STARS = [1, 2, 3, 4, 5] as const;

type Props = {
  /** Note affichée, de 0 à 5 ; les demi-étoiles sont arrondies au plus proche. */
  value: number;
  size?: number;
  /** Rend les étoiles cliquables : sans lui, l'affichage est en lecture seule. */
  onChange?: (rating: number) => void;
  disabled?: boolean;
};

export default function StarRating({
  value,
  size = 16,
  onChange,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const rounded = Math.round(value * 2) / 2;

  const iconFor = (star: number) =>
    rounded >= star
      ? 'star'
      : rounded >= star - 0.5
        ? 'star-half'
        : 'star-outline';

  if (!onChange) {
    return (
      <View
        className="flex-row"
        accessible
        accessibilityLabel={`${value.toFixed(1)} sur 5`}
      >
        {STARS.map(star => (
          <Ionicons
            key={star}
            name={iconFor(star)}
            size={size}
            color={rounded >= star - 0.5 ? STAR_COLOR : colors.icon}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row" accessibilityRole="adjustable">
      {STARS.map(star => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          disabled={disabled}
          hitSlop={6}
          className="px-1"
          accessibilityRole="button"
          accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          accessibilityState={{ selected: value === star, disabled }}
        >
          <Ionicons
            name={value >= star ? 'star' : 'star-outline'}
            size={size}
            color={value >= star ? STAR_COLOR : colors.icon}
            style={{ opacity: disabled ? 0.5 : 1 }}
          />
        </Pressable>
      ))}
    </View>
  );
}
