/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        tag: ['"Permanent Marker"', 'cursive'],
        mono: ['"Space Grotesk"', 'monospace']
      },
      colors: {
        asphalt: {
          950: '#07080a',
          900: '#0a0b0e',
          850: '#0f1117',
          800: '#141720',
          700: '#1c202c',
          600: '#2a3042'
        },
        spray: {
          pink: '#ff0055',
          pinkHover: '#ff2a75',
          volt: '#00ff88',
          voltHover: '#2eff9f',
          yellow: '#ffe600',
          purple: '#8a2be2',
          cyan: '#00e5ff'
        },
        brand: {
          50: '#fff0f5',
          100: '#ffe0eb',
          500: '#ff0055',
          600: '#e6004c',
          700: '#cc0044',
          900: '#660022'
        }
      },
      boxShadow: {
        'spray-pink': '0 0 25px -5px rgba(255, 0, 85, 0.45)',
        'spray-volt': '0 0 25px -5px rgba(0, 255, 136, 0.45)',
        'spray-yellow': '0 0 25px -5px rgba(255, 230, 0, 0.45)',
        'tag-glow': '0 0 15px rgba(255, 0, 85, 0.35)',
        'brutalist': '4px 4px 0px 0px rgba(0, 0, 0, 0.9)'
      }
    },
  },
  plugins: [],
}
