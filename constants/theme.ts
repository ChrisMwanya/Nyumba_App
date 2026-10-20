/**
 * Fasi — Centralized Theme Tokens
 *
 * This file is the **single source of truth** for every colour used across the
 * app. Screens and components should never hard-code hex values; they import
 * colours from the resolved theme via the `useTheme()` hook instead.
 */

import { Platform } from 'react-native';

/* ------------------------------------------------------------------ */
/*  Colour palettes                                                    */
/* ------------------------------------------------------------------ */

/*
 * Charte commune à la landing (Landing page/app/globals.css) et à l'admin
 * (Admin/src/app/globals.css) : fond blanc, cartes bordées d'un filet sans
 * ombre, aplats de couleurs franches, jamais de dégradé. Les actions
 * principales sont des pilules « encre » (noires en clair, blanches en
 * sombre) ; le teal marque l'état actif et les liens.
 */

/** Aplats d'accent, identiques dans les deux modes (texte `ink` dessus). */
export const Tiles = {
  mint: '#7EE0C5',
  yellow: '#FFD84D',
  lilac: '#CBB9FF',
  coral: '#FF9470',
  sky: '#A9C9FF',
} as const;

export type TileName = keyof typeof Tiles;

export const Colors = {
  /* -------- LIGHT MODE -------- */
  light: {
    // Backgrounds
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F3F8',
    muted: '#F1F3F8',

    // Brand / Accent
    teal: '#00806A',
    tealSoft: '#E0F2EE',
    tealInk: '#00574A',
    accent: '#E0F2EE',
    primary: '#183070',
    navy: '#183070',
    // Texte de marque : marine en clair, blanc en sombre
    brandInk: '#183070',

    // Action principale : pilule encre
    cta: '#0B0F1A',
    ctaText: '#FFFFFF',

    // Text
    text: '#0B0F1A',
    textSecondary: '#4F586B',
    textMuted: '#4F586B',
    textInverse: '#FFFFFF',
    // Encre des textes posés sur les aplats `Tiles`
    ink: '#0B0F1A',

    // Borders & Dividers
    border: '#E2E6EF',
    input: '#D3D9E4',
    borderFocused: '#00806A',
    divider: '#E2E6EF',

    // Icons
    icon: '#4F586B',
    iconActive: '#00806A',

    // Tab bar
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E6EF',
    tabBarActive: '#00806A',
    tabBarInactive: '#98A2B8',

    // Status colours
    success: '#188038',
    successSoft: '#E6F4EA',
    warning: '#B06000',
    warningSoft: '#FEF7E0',
    error: '#D93025',
    errorSoft: '#FCE8E6',
    errorBorder: 'rgba(217, 48, 37, 0.25)',
    info: '#1967D2',
    infoSoft: '#E8F0FE',

    // Misc
    star: '#F9AB00',
    overlay: 'rgba(11, 15, 26, 0.40)',
    modalOverlay: 'rgba(11, 15, 26, 0.50)',
    skeleton: '#E8ECF3',
    whatsapp: '#25D366',
    whatsappSoft: 'rgba(37, 211, 102, 0.10)',
    whatsappBorder: 'rgba(37, 211, 102, 0.20)',

    // StatusBar
    statusBar: 'dark' as const,
  },

  /* -------- DARK MODE -------- */
  dark: {
    // Backgrounds
    bg: '#0D1322',
    surface: '#151C2F',
    surfaceElevated: '#1A2238',
    muted: '#1F2840',

    // Brand / Accent
    teal: '#4FD1B5',
    tealSoft: '#0F3D35',
    tealInk: '#B8EFE2',
    accent: '#0F3D35',
    primary: '#183070',
    navy: '#183070',
    brandInk: '#FFFFFF',

    // Action principale : pilule encre inversée
    cta: '#FFFFFF',
    ctaText: '#0B0F1A',

    // Text
    text: '#E4E8F1',
    textSecondary: '#98A2B8',
    textMuted: '#98A2B8',
    textInverse: '#0B0F1A',
    ink: '#0B0F1A',

    // Borders & Dividers
    border: '#253049',
    input: '#34405E',
    borderFocused: '#4FD1B5',
    divider: '#253049',

    // Icons
    icon: '#98A2B8',
    iconActive: '#4FD1B5',

    // Tab bar
    tabBarBg: '#0D1322',
    tabBarBorder: '#253049',
    tabBarActive: '#4FD1B5',
    tabBarInactive: '#6B7590',

    // Status colours
    success: '#81C995',
    successSoft: 'rgba(129, 201, 149, 0.14)',
    warning: '#FDD663',
    warningSoft: 'rgba(253, 214, 99, 0.14)',
    error: '#F28B82',
    errorSoft: 'rgba(242, 139, 130, 0.14)',
    errorBorder: 'rgba(242, 139, 130, 0.30)',
    info: '#8AB4F8',
    infoSoft: 'rgba(138, 180, 248, 0.14)',

    // Misc
    star: '#FDD663',
    overlay: 'rgba(0, 0, 0, 0.45)',
    modalOverlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#1F2840',
    whatsapp: '#25D366',
    whatsappSoft: 'rgba(37, 211, 102, 0.10)',
    whatsappBorder: 'rgba(37, 211, 102, 0.20)',

    // StatusBar
    statusBar: 'light' as const,
  },
};

/**
 * Ombre discrète (équivalent `shadow-sm` de la landing), réservée aux éléments
 * flottants posés sur la carte. Les cartes de contenu n'ont pas d'ombre : un
 * filet `border` suffit.
 */
export const FloatShadow = {
  shadowColor: '#0B0F1A',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

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
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
