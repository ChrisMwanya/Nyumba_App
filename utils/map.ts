import { router } from 'expo-router';

export const openDirections = (
  latitude: number | string,
  longitude: number | string,
  label: string = 'Destination',
  language: 'fr' | 'en' = 'fr'
) => {
  router.push({
    pathname: '/annonces/directions',
    params: {
      latitude: String(latitude),
      longitude: String(longitude),
      title: label,
      language,
    },
  } as any);
};
