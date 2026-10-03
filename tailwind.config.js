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
        primary: {
          50: '#f1fbfc',
          100: '#dff4f6',
          200: '#bfe7eb',
          300: '#9ed9df',
          400: '#7bcbd3',
          500: '#58b9c4',
          600: '#3da1ae',
          700: '#2f8492',
          800: '#286a76',
          900: '#225762',
        },
      },
    },
  },
  plugins: [],
}
