/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0a0a0c',
          900: '#121215',
          850: '#18181d',
          800: '#22222a',
          700: '#2e2e38',
          600: '#42424f',
        },
        primary: {
          DEFAULT: '#84cc16', // electric lime
          hover: '#65a30d',
          light: '#bef264',
          dark: '#4d7c0f',
          glow: 'rgba(132, 204, 22, 0.25)',
        },
        accent: {
          cyan: '#06b6d4',
          purple: '#a855f7',
          orange: '#f97316',
          red: '#ef4444',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(132, 204, 22, 0.3)',
        'glow-sm': '0 0 10px -2px rgba(132, 204, 22, 0.25)',
      }
    },
  },
  plugins: [],
}
