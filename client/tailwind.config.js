/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(['bg', 'fg', 'muted', 'line', 'soft', 'accent'].map((k) => [k, `rgb(var(--${k}) / <alpha-value>)`])),
      fontFamily: {
        sans: ['Inter', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Noto Serif Bengali', 'serif'],
      },
    },
  },
  plugins: [],
};
