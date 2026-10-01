import { ApiError } from '@/services/api';
import type {
  AuthTokens,
  AuthUser,
  LoginResponse,
} from '@/services/authService';
import * as authService from '@/services/authService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const SECURE_KEYS = {
  ACCESS_TOKEN: 'nyumba_access_token',
  REFRESH_TOKEN: 'nyumba_refresh_token',
  PENDING_VERIFICATION: 'nyumba_pending_verification',
};

export type PendingVerification = {
  // Email ou téléphone utilisé comme identifiant auprès de l'API
  destination: string;
  verificationMethod: 'email' | 'sms';
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  pendingVerification: PendingVerification | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  /** Adopte un couple de jetons réémis par l'API (changement de mot de passe). */
  applyTokens: (tokens: AuthTokens) => Promise<void>;
  setPendingVerification: (data: PendingVerification | null) => void;
  confirmOtp: (otp: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function pendingFor(identifier: string): PendingVerification {
  return {
    destination: identifier,
    verificationMethod: identifier.includes('@') ? 'email' : 'sms',
  };
}

async function savePendingVerification(data: PendingVerification | null) {
  if (data) {
    await SecureStore.setItemAsync(
      SECURE_KEYS.PENDING_VERIFICATION,
      JSON.stringify(data)
    );
  } else {
    await SecureStore.deleteItemAsync(SECURE_KEYS.PENDING_VERIFICATION);
  }
}

async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  await SecureStore.setItemAsync(
    SECURE_KEYS.REFRESH_TOKEN,
    tokens.refreshToken
  );
}

async function clearTokens() {
  await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pendingVerification, setPendingVerificationState] =
    useState<PendingVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // L'API ne renvoie pas de token après la vérification OTP : on garde les
  // identifiants en mémoire (jamais persistés) pour reconnecter l'utilisateur
  // automatiquement une fois son compte vérifié.
  const credentialsRef = useRef<{
    identifier: string;
    password: string;
  } | null>(null);

  // Charger la session persistée au démarrage
  useEffect(() => {
    async function loadSession() {
      try {
        // Restaurer pendingVerification si présent
        const savedPending = await SecureStore.getItemAsync(
          SECURE_KEYS.PENDING_VERIFICATION
        );
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
          const savedRefresh = await SecureStore.getItemAsync(
            SECURE_KEYS.REFRESH_TOKEN
          );
          if (savedRefresh) {
            const { tokens } = await authService.refreshToken(savedRefresh);
            await saveTokens(tokens);
            const me = await authService.getMe(tokens.accessToken);
            setAccessToken(tokens.accessToken);
            setUser(me);
          }
        } catch {
          await clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // Wrapper qui persiste ET met à jour le state
  const setPendingVerification = useCallback(
    async (data: PendingVerification | null) => {
      await savePendingVerification(data);
      setPendingVerificationState(data);
    },
    []
  );

  const startSession = useCallback(
    async (data: LoginResponse) => {
      await saveTokens(data.tokens);
      // Le login ne renvoie que id/role/fullName : on complète avec le profil
      const me = await authService
        .getMe(data.tokens.accessToken)
        .catch(() => data.user);
      credentialsRef.current = null;
      await setPendingVerification(null);
      setAccessToken(data.tokens.accessToken);
      setUser(me);
      // La redirection (onboarding ou accueil) est faite par le layout racine
    },
    [setPendingVerification]
  );

  const goToOtp = useCallback(
    async (identifier: string, password: string) => {
      credentialsRef.current = { identifier, password };
      await setPendingVerification(pendingFor(identifier));
      router.replace('/(auth)/verify-otp' as any);
    },
    [setPendingVerification]
  );

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      let data: LoginResponse;
      try {
        data = await authService.login(identifier, password);
      } catch (err) {
        // 403 : identifiants corrects mais compte non vérifié → nouveau code puis écran OTP
        if (err instanceof ApiError && err.status === 403) {
          await authService.resendOtp(identifier).catch(() => {});
          await goToOtp(identifier, password);
          return;
        }
        throw err;
      }
      await startSession(data);
    },
    [goToOtp, startSession]
  );

  const signUp = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
    }) => {
      await authService.signup(payload);
      await goToOtp(payload.email || payload.phone!, payload.password);
    },
    [goToOtp]
  );

  const confirmOtp = useCallback(
    async (otp: string) => {
      if (!pendingVerification) return;
      await authService.verifyOtp(pendingVerification.destination, otp);

      const credentials = credentialsRef.current;
      if (credentials) {
        try {
          await startSession(
            await authService.login(
              credentials.identifier,
              credentials.password
            )
          );
          return;
        } catch {
          // Compte vérifié mais reconnexion impossible : l'utilisateur se connectera manuellement
        }
      }
      // App relancée entre-temps : les identifiants ne sont plus en mémoire
      credentialsRef.current = null;
      await setPendingVerification(null);
      router.replace('/(auth)/login' as any);
    },
    [pendingVerification, setPendingVerification, startSession]
  );

  // Après un changement de mot de passe, l'API invalide toutes les sessions et
  // rend des jetons neufs : sans cette adoption, la requête suivante de cet
  // appareil serait rejetée et l'utilisateur se retrouverait déconnecté.
  const applyTokens = useCallback(async (tokens: AuthTokens) => {
    await saveTokens(tokens);
    setAccessToken(tokens.accessToken);
  }, []);

  const signOut = useCallback(async () => {
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch {
        // Ignorer les erreurs de déconnexion réseau
      }
    }
    await clearTokens();
    await savePendingVerification(null);
    credentialsRef.current = null;
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
        applyTokens,
        setPendingVerification,
        confirmOtp,
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
