const THEME_KEY = 'theme'
const FONT_KEY = 'fontScale'

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'system'
}

export function getStoredFontScale() {
  return localStorage.getItem(FONT_KEY) || '1'
}

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent('themechange'))
}

export function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale)
}

export function setFontScale(scale) {
  localStorage.setItem(FONT_KEY, scale)
  applyFontScale(scale)
}

export function initTheme() {
  applyTheme(getStoredTheme())
  applyFontScale(getStoredFontScale())
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system')
      window.dispatchEvent(new CustomEvent('themechange'))
    }
  }
  mq.addEventListener('change', listener)
}
