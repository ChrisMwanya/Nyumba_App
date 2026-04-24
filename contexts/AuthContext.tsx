import { ApiError } from '@/services/api';
import type { AuthUser, VerifyOtpResponse } from '@/services/authService';
import * as authService from '@/services/authService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const SECURE_KEYS = {
  ACCESS_TOKEN: 'nyumba_access_token',
  REFRESH_TOKEN: 'nyumba_refresh_token',
  PENDING_VERIFICATION: 'nyumba_pending_verification',
};

export type PendingVerification = {
  userId: number;
  destination: string;
  verificationMethod: 'email' | 'sms';
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  pendingVerification: PendingVerification | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (uid: string, password: string) => Promise<void>;
  signUp: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  setPendingVerification: (data: PendingVerification | null) => void;
  completeSignIn: (data: VerifyOtpResponse) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function savePendingVerification(data: PendingVerification | null) {
  if (data) {
    await SecureStore.setItemAsync(SECURE_KEYS.PENDING_VERIFICATION, JSON.stringify(data));
  } else {
    await SecureStore.deleteItemAsync(SECURE_KEYS.PENDING_VERIFICATION);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pendingVerification, setPendingVerificationState] = useState<PendingVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la session persistée au démarrage
  useEffect(() => {
    async function loadSession() {
      try {
        // Restaurer pendingVerification si présent
        const savedPending = await SecureStore.getItemAsync(SECURE_KEYS.PENDING_VERIFICATION);
        if (savedPending) {
          setPendingVerificationState(JSON.parse(savedPending));
        }

        const saved = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        if (saved) {
          const me = await authService.getMe(saved);
          setAccessToken(saved);
          setUser(me);
        }
      } catch {
        try {
          const savedToken = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
          if (savedToken) {
            const { token } = await authService.refreshToken(savedToken);
            await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, token.value);
            const me = await authService.getMe(token.value);
            setAccessToken(token.value);
            setUser(me);
          }
        } catch {
          await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // Wrapper qui persiste ET met à jour le state
  const setPendingVerification = useCallback(async (data: PendingVerification | null) => {
    await savePendingVerification(data);
    setPendingVerificationState(data);
  }, []);

  const signIn = useCallback(async (uid: string, password: string) => {
    const data = await authService.login(uid, password);
    const tokenValue = data.token.value;
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokenValue);
    setAccessToken(tokenValue);
    setUser(data.user);
    const status = data.user?.status?.toLowerCase().trim();
    if (status === 'active') {
      router.replace('/(tabs)' as any);
    } else {
      // Compte en_attente — rediriger vers OTP
      const pending: PendingVerification = {
        userId: data.user.id,
        destination: data.user.email ?? data.user.phone ?? '',
        verificationMethod: data.user.email ? 'email' : 'sms',
      };
      await savePendingVerification(pending);
      setPendingVerificationState(pending);
      router.replace('/(auth)/verify-otp' as any);
    }
  }, []);

  const signUp = useCallback(async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    const data = await authService.signup(payload);
    const pending: PendingVerification = {
      userId: data.user.id,
      destination: data.destination,
      verificationMethod: data.verificationMethod,
    };
    // Persister avant la navigation pour éviter la perte d'état
    await savePendingVerification(pending);
    setPendingVerificationState(pending);
    router.replace('/(auth)/verify-otp' as any);
  }, []);

  const completeSignIn = useCallback(async (data: VerifyOtpResponse) => {
    const tokenValue = data.token.value;
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokenValue);
    await savePendingVerification(null);
    setAccessToken(tokenValue);
    setUser(data.user);
    setPendingVerificationState(null);
    const status = data.user?.status?.toLowerCase().trim();
    if (status === 'active') {
      router.replace('/(tabs)' as any);
    } else {
      router.replace('/(auth)/verify-otp' as any);
    }
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
    await savePendingVerification(null);
    setAccessToken(null);
    setUser(null);
    setPendingVerificationState(null);
    router.replace('/(auth)/login' as any);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        pendingVerification,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUser: setUser,
        setPendingVerification,
        completeSignIn,
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
