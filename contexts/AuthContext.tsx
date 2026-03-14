import { ApiError } from '@/services/api';
import type { AuthUser } from '@/services/authService';
import * as authService from '@/services/authService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const SECURE_KEYS = {
  ACCESS_TOKEN: 'nyumba_access_token',
  REFRESH_TOKEN: 'nyumba_refresh_token',
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (uid: string, password: string) => Promise<void>;
  signUp: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la session persistée au démarrage
  useEffect(() => {
    async function loadSession() {
      try {
        const saved = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        if (saved) {
          // Vérifier que le token est encore valide
          const { user: me } = await authService.getMe(saved);
          setAccessToken(saved);
          setUser(me);
        }
      } catch {
        // Token expiré ou invalide → essayer de rafraîchir
        try {
          const refresh = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
          if (refresh) {
            const { access_token } = await authService.refreshToken(refresh);
            await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, access_token.token);
            const { user: me } = await authService.getMe(access_token.token);
            setAccessToken(access_token.token);
            setUser(me);
          }
        } catch {
          // Session invalide → nettoyage
          await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const signIn = useCallback(async (uid: string, password: string) => {
    const data = await authService.login(uid, password);
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, data.access_token.token);
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, data.refresh_token.token);
    setAccessToken(data.access_token.token);
    setUser(data.user);
    if (data.user?.emailVerifiedAt) {
      router.replace('/(tabs)' as any);
    } else {
      router.replace('/(auth)/verify-otp' as any);
    }
  }, []);

  const signUp = useCallback(async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => {
    const data = await authService.register(payload);
    // Après inscription, l'API renvoie un seul token → on redirige vers login
    // pour que l'utilisateur se connecte et reçoive access + refresh tokens
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, data.token.token);
    setAccessToken(data.token.token);
    setUser(data.user);
    router.replace('/(auth)/verify-otp' as any);
  }, []);

  const signOut = useCallback(async () => {
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch {
        // Ignorer les erreurs de déconnexion réseau
      }
    }
    await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    setAccessToken(null);
    setUser(null);
    router.replace('/(auth)/login' as any);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUser: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
