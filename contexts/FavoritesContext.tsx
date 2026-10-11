import { router } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';

import type { Annonce } from '@/services/annonceService';
import * as favoriteService from '@/services/favoriteService';
import { useAuth } from './AuthContext';

type FavoritesContextType = {
  /** Annonces favorites, de la plus récente à la plus ancienne. */
  favorites: Annonce[];
  isFavorite: (annonceId: string) => boolean;
  /** Ajoute ou retire une annonce ; redirige vers la connexion si besoin. */
  toggleFavorite: (annonce: Annonce) => void;
  refresh: () => Promise<void>;
  loading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [favorites, setFavorites] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(false);
  // L'API bascule l'état à chaque appel : deux appels simultanés sur la même
  // annonce s'annuleraient. On ignore donc les touchers pendant la requête.
  const pending = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setFavorites(await favoriteService.getMyFavorites(accessToken));
    } catch (error) {
      console.error('Fetch favorites error:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Chargés à la connexion, vidés à la déconnexion
  useEffect(() => {
    if (accessToken) {
      refresh();
    } else {
      setFavorites([]);
    }
  }, [accessToken, refresh]);

  const isFavorite = useCallback(
    (annonceId: string) =>
      favorites.some(favorite => favorite.id === annonceId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (annonce: Annonce) => {
      if (!accessToken) {
        router.push('/(auth)/login' as any);
        return;
      }
      if (pending.current.has(annonce.id)) return;
      pending.current.add(annonce.id);

      const wasFavorite = favorites.some(
        favorite => favorite.id === annonce.id
      );
      const apply = (favorite: boolean) =>
        setFavorites(current => {
          const without = current.filter(item => item.id !== annonce.id);
          return favorite ? [annonce, ...without] : without;
        });

      // Mise à jour immédiate, corrigée ensuite par la réponse de l'API
      apply(!wasFavorite);
      favoriteService
        .toggleFavorite(annonce.id, accessToken)
        .then(apply)
        .catch(() => {
          apply(wasFavorite);
          Alert.alert(
            'Favoris',
            'Impossible de mettre à jour vos favoris. Réessayez.'
          );
        })
        .finally(() => pending.current.delete(annonce.id));
    },
    [accessToken, favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, refresh, loading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
