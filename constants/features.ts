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

export const getDynamicFeatures = (annonce: any): FeatureItem[] => {
  const categorySlug = annonce.category?.slug || '';

  if (categorySlug === 'airbnbs' || categorySlug === 'hotels') {
    const acc = annonce.accommodationDetail || annonce.hotelDetail;
    if (acc) {
      const features: FeatureItem[] = [];
      if (acc.numberOfRooms) features.push({ icon: 'home-outline', label: 'Pièces', value: `${acc.numberOfRooms} Pièce(s)` });
      if (acc.numberOfBeds) features.push({ icon: 'bed-outline', label: 'Lits', value: `${acc.numberOfBeds} Lit(s)` });
      if (acc.stars) features.push({ icon: 'star-outline', label: 'Étoiles', value: `${acc.stars} Étoiles` });
      if ('checkInTime' in acc && acc.checkInTime) features.push({ icon: 'time-outline', label: 'Arrivée', value: acc.checkInTime });
      if ('checkOutTime' in acc && acc.checkOutTime) features.push({ icon: 'time-outline', label: 'Départ', value: acc.checkOutTime });
      if (acc.hasWifi) features.push({ icon: 'wifi-outline', label: 'Wifi', value: 'Inclus' });
      if (acc.hasPool) features.push({ icon: 'water-outline', label: 'Piscine', value: 'Oui' });
      if (acc.hasAirConditioning) features.push({ icon: 'snow-outline', label: 'Clim', value: 'Oui' });
      if (acc.hasKitchen) features.push({ icon: 'restaurant-outline', label: 'Cuisine', value: 'Oui' });
      if (acc.hasBreakfast) features.push({ icon: 'cafe-outline', label: 'Petit-déj', value: 'Inclus' });
      
      if (features.length > 0) return features;
    }
  }

  if (categorySlug === 'restaurants' || categorySlug === 'bistrots') {
    const rest = annonce.restaurantDetail;
    if (rest) {
      const features: FeatureItem[] = [];
      if (rest.cuisineType) features.push({ icon: 'restaurant-outline', label: 'Cuisine', value: rest.cuisineType });
      if (rest.averagePrice) features.push({ icon: 'cash-outline', label: 'Prix moyen', value: `~${rest.averagePrice}$` });
      if (rest.openingHours) features.push({ icon: 'time-outline', label: 'Horaires', value: rest.openingHours });
      if (rest.alcoholAvailable) features.push({ icon: 'wine-outline', label: 'Alcool', value: 'Oui' });
      if (rest.hasDelivery) features.push({ icon: 'bicycle-outline', label: 'Livraison', value: 'Oui' });
      if (rest.hasReservation) features.push({ icon: 'calendar-outline', label: 'Réservation', value: 'Oui' });
      
      if (features.length > 0) return features;
    }
  }

  if (categorySlug === 'boites-nuits' || categorySlug === 'coins-detente') {
    const club = annonce.clubDetail;
    if (club) {
      const features: FeatureItem[] = [];
      if (club.musicType) features.push({ icon: 'musical-notes-outline', label: 'Musique', value: club.musicType });
      if (club.dressCode) features.push({ icon: 'shirt-outline', label: 'Dress Code', value: club.dressCode });
      if (club.entranceFee) features.push({ icon: 'cash-outline', label: 'Prix d\'entrée', value: `${club.entranceFee}$` });
      if (club.openingDays) features.push({ icon: 'calendar-outline', label: 'Ouverture', value: club.openingDays });
      if (club.vipAvailable) features.push({ icon: 'star-outline', label: 'VIP', value: 'Oui' });
      if (club.minimumAge) features.push({ icon: 'person-outline', label: 'Âge min', value: `${club.minimumAge}+` });
      
      if (features.length > 0) return features;
    }
  }

  return getCategoryFeatures(categorySlug);
};
