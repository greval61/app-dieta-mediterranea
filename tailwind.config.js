/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'med-olive': '#8B9467',
        'med-offwhite': '#F9F6F2',
        'med-blue': '#98B4D4',
        'med-blue-light': '#E1EBF4',
        'med-terracotta': '#C05746',
        'med-cream': '#FDFCFB',
        'med-slate': '#2C3E50',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
