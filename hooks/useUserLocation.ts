import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Coordinates } from '@/utils/geo';

type PermissionState = 'pending' | 'granted' | 'denied';

/**
 * Position de l'utilisateur pour la carte d'accueil.
 *
 * La permission est demandée dès le montage : l'accueil s'ouvre sur une carte
 * centrée sur l'utilisateur, donc attendre une action de sa part n'aurait pas
 * de sens. Un refus n'est pas bloquant — la carte retombe sur un centre par
 * défaut et `permission` vaut alors `denied`.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [permission, setPermission] = useState<PermissionState>('pending');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted.current) setPermission('denied');
        return null;
      }

      // `getLastKnownPositionAsync` répond instantanément : la carte se cale
      // tout de suite, puis se recale sur le point GPS précis dès qu'il arrive.
      const last = await Location.getLastKnownPositionAsync();
      if (last && mounted.current) {
        setCoords({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });
        setPermission('granted');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      if (mounted.current) {
        setCoords(next);
        setPermission('granted');
      }
      return next;
    } catch {
      if (mounted.current) setPermission('denied');
      return null;
    }
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { coords, permission, request };
}
