/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C18',
          900: '#0B132B',
          850: '#111C38',
          800: '#1C2541',
          700: '#2A365B',
        },
        slate: {
          850: '#151E2E',
          750: '#243044',
        },
        teal: {
          DEFAULT: '#0D9488',
          light: '#14B8A6',
          dark: '#0F766E',
          glow: 'rgba(20, 184, 166, 0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        rose: {
          DEFAULT: '#E11D48',
          light: '#F43F5E',
          glow: 'rgba(225, 29, 72, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-teal': '0 0 20px -5px rgba(20, 184, 166, 0.3)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-rose': '0 0 20px -5px rgba(225, 29, 72, 0.3)',
      }
    },
  },
  plugins: [],
}
