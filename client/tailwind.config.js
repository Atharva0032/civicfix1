/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep blue — the civic/authority anchor colour.
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#c7dcff',
          300: '#a4c6ff',
          400: '#7ba6fb',
          500: '#5583f4',
          600: '#3562e6',
          700: '#2949c4',
          800: '#253f9e',
          900: '#24397d',
          950: '#172451',
        },
        // Teal — the "action / success" accent.
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        navy: {
          700: '#16224a',
          800: '#0f1730',
          900: '#0a1024',
          950: '#060a18',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 48 / 0.04), 0 8px 24px -12px rgb(15 23 48 / 0.14)',
        'card-hover': '0 2px 4px 0 rgb(15 23 48 / 0.06), 0 18px 40px -18px rgb(15 23 48 / 0.22)',
        glow: '0 0 0 4px rgb(85 131 244 / 0.14)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
