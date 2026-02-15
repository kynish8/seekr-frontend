/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          primary: '#FF6900',
          light: '#FF8533',
          dark: '#CC5400',
        },
        navy: {
          dark: '#2D3748',
          darker: '#1A202C',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', 'sans-serif'],
        display: ['Geist Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
