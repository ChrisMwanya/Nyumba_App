export type FeatureItem = {
  icon: string;
  label: string;
  value: string;
};

export const getCategoryFeatures = (categorySlug: string): FeatureItem[] => {
  switch (categorySlug) {
    case 'restaurants':
      return [
        { icon: 'restaurant-outline', label: 'Cuisine', value: 'Gastronomique' },
        { icon: 'time-outline', label: 'Service', value: 'Midi & Soir' },
        { icon: 'people-outline', label: 'Ambiance', value: 'Chaleureuse' }
      ];
    case 'hotels':
      return [
        { icon: 'bed-outline', label: 'Chambres', value: 'Luxe' },
        { icon: 'wifi-outline', label: 'Wifi', value: 'Fibre incluse' },
        { icon: 'cafe-outline', label: 'Petit-déj', value: 'Inclus' }
      ];
    case 'airbnbs':
      return [
        { icon: 'home-outline', label: 'Type', value: 'Logement entier' },
        { icon: 'bed-outline', label: 'Lits', value: '2 Chambres' },
        { icon: 'wifi-outline', label: 'Équipements', value: 'Netflix & Wifi' }
      ];
    case 'coins-detente':
      return [
        { icon: 'wine-outline', label: 'Cocktails', value: 'Premium' },
        { icon: 'leaf-outline', label: 'Cadre', value: 'Nature & Lounge' },
        { icon: 'musical-notes-outline', label: 'Musique', value: 'Chill' }
      ];
    case 'bistrots':
      return [
        { icon: 'beer-outline', label: 'Boissons', value: 'Bières & Vins' },
        { icon: 'fast-food-outline', label: 'Cuisine', value: 'Tapas & Grills' },
        { icon: 'chatbubbles-outline', label: 'Esprit', value: 'Convivial' }
      ];
    case 'boites-nuits':
      return [
        { icon: 'flash-outline', label: 'DJ Set', value: 'Live' },
        { icon: 'wine-outline', label: 'Espace', value: 'VIP Lounges' },
        { icon: 'time-outline', label: 'Ouverture', value: '22h - Aube' }
      ];
    default:
      return [
        { icon: 'star-outline', label: 'Prestation', value: 'Standard' },
        { icon: 'location-outline', label: 'Localisation', value: 'Kinshasa' },
        { icon: 'sparkles-outline', label: 'Qualité', value: 'Premium' }
      ];
  }
};
