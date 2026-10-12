/** @type {import('tailwindcss').Config} */
// Material Design 3 — các "vai trò màu" (color roles) khai báo bằng CSS variable ở src/index.css,
// đổi giá trị theo class `.dark`. Tên token Tailwind bám theo tên vai trò của M3.
const role = (name) => `rgb(var(--md-${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      colors: {
        primary: role('primary'),
        'on-primary': role('on-primary'),
        'primary-container': role('primary-container'),
        'on-primary-container': role('on-primary-container'),
        secondary: role('secondary'),
        'on-secondary': role('on-secondary'),
        tertiary: role('tertiary'),
        'on-tertiary': role('on-tertiary'),
        'secondary-container': role('secondary-container'),
        'on-secondary-container': role('on-secondary-container'),
        'tertiary-container': role('tertiary-container'),
        'on-tertiary-container': role('on-tertiary-container'),
        error: role('error'),
        'on-error': role('on-error'),
        'error-container': role('error-container'),
        'on-error-container': role('on-error-container'),
        background: role('surface'),
        surface: role('surface'),
        'surface-dim': role('surface-dim'),
        'surface-container-lowest': role('surface-container-lowest'),
        'surface-container-low': role('surface-container-low'),
        'surface-container': role('surface-container'),
        'surface-container-high': role('surface-container-high'),
        'surface-container-highest': role('surface-container-highest'),
        'on-surface': role('on-surface'),
        'on-surface-variant': role('on-surface-variant'),
        outline: role('outline'),
        'outline-variant': role('outline-variant'),
        'inverse-surface': role('inverse-surface'),
        'inverse-on-surface': role('inverse-on-surface'),
        'inverse-primary': role('inverse-primary'),
        mood: {
          great: '#F0A34E',
          good: '#8FBF7F',
          okay: '#9FB8C8',
          sad: '#7D8CB0',
          angry: '#C4676B'
        }
      },
      // Shape scale của M3: xs 4 · sm 8 · md 12 · lg 16 · xl 28 · full
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '28px'
      },
      boxShadow: {
        'elev-1': '0 1px 2px rgb(0 0 0 / 0.30), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
        'elev-2': '0 1px 2px rgb(0 0 0 / 0.30), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
        'elev-3': '0 1px 3px rgb(0 0 0 / 0.30), 0 4px 8px 3px rgb(0 0 0 / 0.15)',
        'elev-4': '0 2px 3px rgb(0 0 0 / 0.30), 0 6px 10px 4px rgb(0 0 0 / 0.15)'
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accel': 'cubic-bezier(0.3, 0, 0.8, 0.15)'
      }
    }
  },
  plugins: []
}
