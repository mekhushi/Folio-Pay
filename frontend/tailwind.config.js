/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        folio: {
          dark: '#0A0F1A',
          card: '#111827',
          neon: '#00FFA3',
          purple: '#9D4EDD',
        }
      }
    },
  },
  plugins: [],
}
