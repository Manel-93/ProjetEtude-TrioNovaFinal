/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Charte graphique Althea */
        ink: '#003d5c',
        ocean: {
          DEFAULT: '#00a8b5',
          hover: '#33bfc9'
        },
        surface: '#d4f4f7',
        mint: '#00a8b5',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#F59E0B'
      }
    }
  },
  plugins: []
};