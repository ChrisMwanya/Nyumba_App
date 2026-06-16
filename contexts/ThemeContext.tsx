import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, type ThemeColors } from '@/constants/theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** The user's explicit choice — "system" follows the OS preference. */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** The user's explicit preference. */
  mode: ThemeMode;
  /** The resolved colour scheme after evaluating "system". */
  scheme: 'light' | 'dark';
  /** Shortcut for `scheme === 'dark'`. */
  isDark: boolean;
  /** Resolved colour tokens for the current scheme. */
  colors: ThemeColors;
  /** Persist a new mode choice. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light / dark (ignores system while toggling). */
  toggleTheme: () => void;
}

/* ------------------------------------------------------------------ */
/*  Persistence helpers                                                */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'nyumba_theme_mode';

async function loadPersistedMode(): Promise<ThemeMode> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // Silently fall back
  }
  return 'dark'; // Default to dark — matches current app design
}

async function persistMode(mode: ThemeMode) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, mode);
  } catch {
    // Best-effort persistence
  }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  // Hydrate persisted preference on mount
  useEffect(() => {
    loadPersistedMode().then((m) => {
      setModeState(m);
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    persistMode(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistMode(next);
      return next;
    });
  }, []);

  // Resolve the effective colour scheme
  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme ?? 'dark') : mode;

  const isDark = scheme === 'dark';
  const colors = Colors[scheme];

  const value: ThemeContextValue = {
    mode,
    scheme,
    isDark,
    colors,
    setMode,
    toggleTheme,
  };

  // Don't render children until persisted preference is loaded to avoid flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

/**
 * Access the full theme context (mode, scheme, colors, toggleTheme, etc.).
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}

/**
 * Shortcut — returns only the resolved colour tokens.
 */
export function useColors(): ThemeColors {
  return useTheme().colors;
}
