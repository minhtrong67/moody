/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        inkmuted: 'rgb(var(--c-inkmuted) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        oncolor: '#F7F5F0',
        primary: {
          DEFAULT: '#0D9488',
          light: '#14B8A6'
        },
        mood: {
          great: '#F0A34E',
          good: '#8FBF7F',
          okay: '#9FB8C8',
          sad: '#7D8CB0',
          angry: '#C4676B'
        }
      },
      borderRadius: {
        card: '0.875rem'
      }
    }
  },
  plugins: []
}
