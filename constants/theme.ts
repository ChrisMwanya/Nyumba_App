/**
 * Nyumba — Centralized Theme Tokens
 *
 * This file is the **single source of truth** for every colour used across the
 * app. Screens and components should never hard-code hex values; they import
 * colours from the resolved theme via the `useTheme()` hook instead.
 */

import { Platform } from 'react-native';

/* ------------------------------------------------------------------ */
/*  Colour palettes                                                    */
/* ------------------------------------------------------------------ */

export const Colors = {
  /* -------- LIGHT MODE -------- */
  light: {
    // Backgrounds
    bg: '#F8F9FB',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F3F6',

    // Brand / Accent
    teal: '#00997D',
    tealSoft: 'rgba(0, 153, 125, 0.10)',
    accent: '#E6F5F2',
    primary: '#1A306C',

    // Text
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: 'rgba(0, 0, 0, 0.08)',
    borderFocused: '#00997D',
    divider: 'rgba(0, 0, 0, 0.05)',

    // Icons
    icon: '#687076',
    iconActive: '#00997D',

    // Tab bar
    tabBarBg: '#FFFFFF',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
    tabBarActive: '#00997D',
    tabBarInactive: '#9CA3AF',

    // Status colours
    success: '#00BFA5',
    warning: '#FF9F0A',
    error: '#EF4444',
    errorSoft: 'rgba(239, 68, 68, 0.10)',
    errorBorder: 'rgba(239, 68, 68, 0.20)',

    // Misc
    star: '#FFD700',
    overlay: 'rgba(0, 0, 0, 0.40)',
    modalOverlay: 'rgba(0, 0, 0, 0.50)',
    skeleton: '#E5E7EB',
    whatsapp: '#25D366',
    whatsappSoft: 'rgba(37, 211, 102, 0.10)',
    whatsappBorder: 'rgba(37, 211, 102, 0.20)',

    // StatusBar
    statusBar: 'dark' as const,
  },

  /* -------- DARK MODE -------- */
  dark: {
    // Backgrounds
    bg: '#0F1721',
    surface: '#1B2531',
    surfaceElevated: '#243040',

    // Brand / Accent
    teal: '#00BFA5',
    tealSoft: 'rgba(0, 191, 165, 0.10)',
    accent: '#0C4A4D',
    primary: '#1A306C',

    // Text
    text: '#ECEDEE',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#11181C',

    // Borders & Dividers
    border: 'rgba(255, 255, 255, 0.05)',
    borderFocused: '#00BFA5',
    divider: 'rgba(255, 255, 255, 0.05)',

    // Icons
    icon: '#6B7280',
    iconActive: '#00BFA5',

    // Tab bar
    tabBarBg: '#0F1721',
    tabBarBorder: 'rgba(255, 255, 255, 0.05)',
    tabBarActive: '#00BFA5',
    tabBarInactive: '#6B7280',

    // Status colours
    success: '#00BFA5',
    warning: '#FF9F0A',
    error: '#EF4444',
    errorSoft: 'rgba(239, 68, 68, 0.10)',
    errorBorder: 'rgba(239, 68, 68, 0.20)',

    // Misc
    star: '#FFD700',
    overlay: 'rgba(0, 0, 0, 0.40)',
    modalOverlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#374151',
    whatsapp: '#25D366',
    whatsappSoft: 'rgba(37, 211, 102, 0.10)',
    whatsappBorder: 'rgba(37, 211, 102, 0.20)',

    // StatusBar
    statusBar: 'light' as const,
  },
};

/** Helper type representing all available token keys. */
export type ThemeColors = typeof Colors.dark | typeof Colors.light;

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
