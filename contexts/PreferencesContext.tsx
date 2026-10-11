import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

export type UserPreferences = {
  // Catégories d'intérêt, mises en avant sur l'accueil
  categoryIds: string[];
  // Ville utilisée par défaut dans les recherches
  cityId: string | null;
};

type PreferencesContextType = {
  // null tant que l'utilisateur n'a pas terminé l'onboarding
  preferences: UserPreferences | null;
  // true une fois les préférences de l'utilisateur connecté chargées
  isReady: boolean;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
};

// L'API n'a pas de champ pour les préférences : elles sont stockées sur
// l'appareil, par utilisateur.
const storageKey = (userId: string) => `nyumba_preferences_${userId}`;

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  // Utilisateur pour lequel `preferences` a été chargé : évite de considérer
  // prêtes les préférences d'une session précédente pendant le chargement.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPreferences(null);
      setLoadedFor(null);
      return;
    }

    let cancelled = false;
    SecureStore.getItemAsync(storageKey(userId))
      .then(raw => (raw ? (JSON.parse(raw) as UserPreferences) : null))
      .catch(() => null)
      .then(saved => {
        if (cancelled) return;
        setPreferences(saved);
        setLoadedFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const savePreferences = useCallback(
    async (next: UserPreferences) => {
      if (!userId) return;
      await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(next));
      setPreferences(next);
    },
    [userId]
  );

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isReady: !!userId && loadedFor === userId,
        savePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
