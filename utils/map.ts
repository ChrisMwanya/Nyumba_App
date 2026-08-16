import { router } from 'expo-router';

export const openDirections = (latitude: number | string, longitude: number | string, label: string = 'Destination') => {
  router.push({
    pathname: '/annonces/directions',
    params: {
      latitude: String(latitude),
      longitude: String(longitude),
      title: label
    }
  } as any);
};
