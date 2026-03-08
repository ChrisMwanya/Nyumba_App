/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx","./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1A306C',
        dark: {
          bg: '#0F1721',
          surface: '#1B2531',
          accent: '#0C4A4D',
          teal: '#00BFA5',
          card: '#1B2531',
        }
      },
      fontFamily: {
        heading: ['PumpDemiBold'],
        body: ['Montserrat_400Regular'],
        'body-medium': ['Montserrat_500Medium'],
        'body-bold': ['Montserrat_700Bold'],
      },
    },
  },
  plugins: [],
}
