import type { Annonce, CategoryAttribute } from '@/services/annonceService';

export type FeatureItem = {
  icon: string;
  label: string;
  value: string;
};

export const getCategoryFeatures = (categorySlug: string): FeatureItem[] => {
  switch (categorySlug) {
    case 'restaurant':
    case 'restaurants':
      return [
        {
          icon: 'restaurant-outline',
          label: 'Cuisine',
          value: 'Gastronomique',
        },
        { icon: 'time-outline', label: 'Service', value: 'Midi & Soir' },
        { icon: 'people-outline', label: 'Ambiance', value: 'Chaleureuse' },
      ];
    case 'hotel':
    case 'hotels':
      return [
        { icon: 'bed-outline', label: 'Chambres', value: 'Luxe' },
        { icon: 'wifi-outline', label: 'Wifi', value: 'Fibre incluse' },
        { icon: 'cafe-outline', label: 'Petit-déj', value: 'Inclus' },
      ];
    case 'airbnbs':
      return [
        { icon: 'home-outline', label: 'Type', value: 'Logement entier' },
        { icon: 'bed-outline', label: 'Lits', value: '2 Chambres' },
        { icon: 'wifi-outline', label: 'Équipements', value: 'Netflix & Wifi' },
      ];
    case 'rooftop':
    case 'coins-detente':
      return [
        { icon: 'wine-outline', label: 'Cocktails', value: 'Premium' },
        { icon: 'leaf-outline', label: 'Cadre', value: 'Nature & Lounge' },
        { icon: 'musical-notes-outline', label: 'Musique', value: 'Chill' },
      ];
    case 'bistrots':
      return [
        { icon: 'beer-outline', label: 'Boissons', value: 'Bières & Vins' },
        {
          icon: 'fast-food-outline',
          label: 'Cuisine',
          value: 'Tapas & Grills',
        },
        { icon: 'chatbubbles-outline', label: 'Esprit', value: 'Convivial' },
      ];
    case 'boites-nuits':
      return [
        { icon: 'flash-outline', label: 'DJ Set', value: 'Live' },
        { icon: 'wine-outline', label: 'Espace', value: 'VIP Lounges' },
        { icon: 'time-outline', label: 'Ouverture', value: '22h - Aube' },
      ];
    default:
      return [
        { icon: 'star-outline', label: 'Prestation', value: 'Standard' },
        { icon: 'location-outline', label: 'Localisation', value: 'Kinshasa' },
        { icon: 'sparkles-outline', label: 'Qualité', value: 'Premium' },
      ];
  }
};

const ATTRIBUTE_ICONS: Record<string, string> = {
  stars: 'star-outline',
  wifi: 'wifi-outline',
  pool: 'water-outline',
  cuisine_type: 'restaurant-outline',
  terrace: 'sunny-outline',
  music: 'musical-notes-outline',
  view: 'eye-outline',
  bedrooms: 'bed-outline',
  happy_hour: 'beer-outline',
  closing_time: 'moon-outline',
  dress_code: 'shirt-outline',
};

const humanize = (key: string) =>
  key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === false)
    return null;
  if (value === true) return 'Oui';
  if (Array.isArray(value)) return value.length ? value.join(', ') : null;
  return String(value);
}

/**
 * Caractéristiques issues des attributs dynamiques du listing. Les définitions
 * de la catégorie, si fournies, donnent les libellés et l'ordre d'affichage.
 */
export const getDynamicFeatures = (
  annonce: Annonce,
  definitions: CategoryAttribute[] = []
): FeatureItem[] => {
  const attributes = annonce.attributes ?? {};
  const keys = definitions.length
    ? [...definitions].sort((a, b) => a.order - b.order).map(d => d.key)
    : Object.keys(attributes);
  const labels = new Map(definitions.map(d => [d.key, d.label]));

  const features: FeatureItem[] = [];
  for (const key of keys) {
    const value = formatValue(attributes[key]);
    if (value) {
      features.push({
        icon: ATTRIBUTE_ICONS[key] ?? 'checkmark-circle-outline',
        label: labels.get(key) ?? humanize(key),
        value,
      });
    }
  }

  return features.length > 0
    ? features
    : getCategoryFeatures(annonce.category?.slug ?? '');
};
