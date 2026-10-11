import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { useFavorites } from '@/contexts/FavoritesContext';
import type { Annonce } from '@/services/annonceService';

/** Rouge du cœur actif : lisible sur la pastille blanche, en clair comme en sombre. */
const HEART_COLOR = '#E5484D';

type Props = {
  annonce: Annonce;
  size?: number;
  className?: string;
};

/**
 * Cœur posé sur une photo : pastille blanche et icône encre, comme les cartes
 * de la landing. Plein et rouge une fois l'annonce en favori.
 */
export default function FavoriteButton({
  annonce,
  size = 36,
  className = '',
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(annonce.id);

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(annonce)}
      hitSlop={8}
      activeOpacity={0.8}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
      }}
      className={`items-center justify-center ${className}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        active ? 'Retirer des favoris' : 'Ajouter aux favoris'
      }
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={Math.round(size * 0.5)}
        color={active ? HEART_COLOR : '#0B0F1A'}
      />
    </TouchableOpacity>
  );
}
