import type { Ionicons } from '@expo/vector-icons';

import { Tiles } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICONS: Record<string, IconName> = {
  restaurant: 'restaurant-outline',
  hotel: 'bed-outline',
  rooftop: 'wine-outline',
  restaurants: 'restaurant-outline',
  hotels: 'bed-outline',
  airbnbs: 'home-outline',
  'coins-detente': 'wine-outline',
  bistrots: 'beer-outline',
  'boites-nuits': 'flash-outline',
};

export const getCategoryIcon = (slug: string): IconName =>
  CATEGORY_ICONS[slug] ?? 'business-outline';

/**
 * Aplat par catégorie, repris de la landing (Hôtels bleu ciel, Restos jaune,
 * Bars lilas…) : c'est ce qui permet de lire la carte d'un coup d'œil, sans
 * légende. Les aplats sont clairs : le texte et les icônes posés dessus
 * utilisent l'encre `CATEGORY_INK`.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  restaurant: Tiles.yellow,
  restaurants: Tiles.yellow,
  hotel: Tiles.sky,
  hotels: Tiles.sky,
  airbnbs: Tiles.mint,
  rooftop: Tiles.lilac,
  'coins-detente': Tiles.lilac,
  bistrots: Tiles.coral,
  'boites-nuits': Tiles.coral,
};

/** Encre des textes et icônes posés sur un aplat de catégorie. */
export const CATEGORY_INK = '#0B0F1A';

export const getCategoryColor = (slug?: string): string =>
  (slug ? CATEGORY_COLORS[slug] : undefined) ?? Tiles.mint;
