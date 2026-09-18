/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          900: '#1e1b4b',
        },
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          surface: '#1F2937',
          border: '#374151',
          hover: '#2D3748',
        },
        studio: {
          bg: '#0c0d12',
          card: '#141721',
          surface: '#1a1e2d',
          border: '#262c3f',
          hover: '#2d344b',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          neon: '#06b6d4',
          beat: '#eab308',
          beatStrong: '#ef4444',
          beatCustom: '#a855f7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
