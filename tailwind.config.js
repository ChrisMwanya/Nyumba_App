/** @type {import('tailwindcss').Config} */
// Couleurs et polices alignées sur la landing et l'admin (voir constants/theme.ts).
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#183070',
        navy: '#183070',
        ink: '#0B0F1A',
        teal: '#00806A',
        'brand-bright': '#4FD1B5',
        tile: {
          mint: '#7EE0C5',
          yellow: '#FFD84D',
          lilac: '#CBB9FF',
          coral: '#FF9470',
          sky: '#A9C9FF',
        },
        dark: {
          bg: '#0D1322',
          surface: '#151C2F',
          accent: '#0F3D35',
          teal: '#4FD1B5',
          card: '#151C2F',
        },
      },
      fontFamily: {
        // Police de marque, réservée au logotype
        heading: ['PumpDemiBold'],
        body: ['GoogleSans_400Regular'],
        'body-medium': ['GoogleSans_500Medium'],
        'body-semibold': ['GoogleSans_600SemiBold'],
        'body-bold': ['GoogleSans_700Bold'],
      },
    },
  },
  plugins: [],
};
