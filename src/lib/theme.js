// Quản lý giao diện: chế độ sáng/tối, cỡ chữ và MÀU CHỦ ĐỀ (seed color → bảng màu Material 3).
const THEME_KEY = 'theme'
const FONT_KEY = 'fontScale'
const SEED_KEY = 'themeSeed' // hex "#RRGGBB" hoặc rỗng = màu mặc định
const CSS_KEY = 'themeCss' // CSS đã sinh, để index.html áp ngay trước khi React chạy (không nháy màu)

export const DEFAULT_SEED = '#769CDF'

// Các màu gợi ý hiển thị trong Cài đặt (key dùng cho i18n: theme.color.<key>).
export const SEED_PRESETS = [
  { key: 'blue', hex: DEFAULT_SEED },
  { key: 'teal', hex: '#009688' },
  { key: 'green', hex: '#5BAA5B' },
  { key: 'yellow', hex: '#D9A400' },
  { key: 'orange', hex: '#E8743B' },
  { key: 'red', hex: '#D9534F' },
  { key: 'pink', hex: '#D86AA8' },
  { key: 'purple', hex: '#8E6FD8' }
]

const VALID_THEMES = ['light', 'dark', 'system']

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    if (value == null || value === '') localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* localStorage bị chặn — bỏ qua */
  }
}

// Chỉ chấp nhận giá trị hợp lệ — localStorage có thể chứa giá trị lạ (app khác cùng origin ghi đè,
// dữ liệu cũ…), khi đó quay về mặc định thay vì làm vỡ giao diện.
export function getStoredTheme() {
  const v = read(THEME_KEY)
  return VALID_THEMES.includes(v) ? v : 'system'
}

export function getStoredFontScale() {
  const v = read(FONT_KEY)
  return ['0.9', '1', '1.15'].includes(v) ? v : '1'
}

export function getStoredSeed() {
  const v = read(SEED_KEY)
  return v && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : DEFAULT_SEED
}

export function isDarkNow() {
  return document.documentElement.classList.contains('dark')
}

// Đọc một "color role" đang áp dụng (vd 'primary') thành #hex — dùng cho biểu đồ SVG.
export function readRole(name) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--md-${name}`).trim()
  const [r, g, b] = raw.split(/\s+/).map(Number)
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#000000'
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}

function syncMetaThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]:not([media])') || document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const [r, g, b] = getComputedStyle(document.documentElement)
    .getPropertyValue('--md-surface')
    .trim()
    .split(/\s+/)
    .map(Number)
  if (![r, g, b].some(Number.isNaN)) meta.setAttribute('content', `rgb(${r}, ${g}, ${b})`)
}

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  // Đồng bộ màu thanh trạng thái / thanh tiêu đề của app PWA với theme đang dùng.
  syncMetaThemeColor()
}

export function setTheme(theme) {
  write(THEME_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent('themechange'))
}

export function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale)
}

export function setFontScale(scale) {
  write(FONT_KEY, scale)
  applyFontScale(scale)
}

// ---------- Màu chủ đề ----------
const ROLE_MAP = {
  primary: 'primary', 'on-primary': 'onPrimary', 'primary-container': 'primaryContainer',
  'on-primary-container': 'onPrimaryContainer', secondary: 'secondary', 'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer', 'on-secondary-container': 'onSecondaryContainer',
  tertiary: 'tertiary', 'on-tertiary': 'onTertiary', 'tertiary-container': 'tertiaryContainer',
  'on-tertiary-container': 'onTertiaryContainer', error: 'error', 'on-error': 'onError',
  'error-container': 'errorContainer', 'on-error-container': 'onErrorContainer', surface: 'surface',
  'surface-dim': 'surfaceDim', 'surface-container-lowest': 'surfaceContainerLowest',
  'surface-container-low': 'surfaceContainerLow', 'surface-container': 'surfaceContainer',
  'surface-container-high': 'surfaceContainerHigh', 'surface-container-highest': 'surfaceContainerHighest',
  'on-surface': 'onSurface', 'on-surface-variant': 'onSurfaceVariant', outline: 'outline',
  'outline-variant': 'outlineVariant', 'inverse-surface': 'inverseSurface',
  'inverse-on-surface': 'inverseOnSurface', 'inverse-primary': 'inversePrimary'
}

// Sinh bảng màu M3 (Tonal Spot — giống Material Theme Builder) từ seed. Thư viện chỉ nạp khi cần.
export async function generateSchemeCss(seedHex) {
  const mcu = await import('@material/material-color-utilities')
  const { argbFromHex, Hct, SchemeTonalSpot, MaterialDynamicColors: M } = mcu
  const source = Hct.fromInt(argbFromHex(seedHex))
  const block = (dark) => {
    const scheme = new SchemeTonalSpot(source, dark, 0)
    return Object.entries(ROLE_MAP)
      .map(([cssName, key]) => {
        const argb = M[key].getArgb(scheme)
        return `--md-${cssName}:${(argb >> 16) & 255} ${(argb >> 8) & 255} ${argb & 255};`
      })
      .join('')
  }
  return `:root{${block(false)}}html.dark{${block(true)}}`
}

export function getReportAccent() {
  // Màu nhấn của báo cáo (nền trắng) — luôn là primary của bảng màu sáng.
  const css = read(CSS_KEY)
  const m = css && css.match(/^:root\{[^}]*--md-primary:(\d+) (\d+) (\d+);/)
  if (!m) return '#415F91'
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

function injectCss(css) {
  let el = document.getElementById('md-theme-override')
  if (!css) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = 'md-theme-override'
    document.head.appendChild(el)
  }
  el.textContent = css
}

// seed === DEFAULT_SEED → dùng đúng bảng màu tĩnh trong index.css (không cần override).
export async function setThemeSeed(seedHex) {
  const hex = seedHex.toUpperCase()
  if (hex === DEFAULT_SEED) {
    write(SEED_KEY, '')
    write(CSS_KEY, '')
    injectCss('')
  } else {
    const css = await generateSchemeCss(hex)
    write(SEED_KEY, hex)
    write(CSS_KEY, css)
    injectCss(css)
  }
  syncMetaThemeColor()
  window.dispatchEvent(new CustomEvent('themechange'))
}

export function initTheme() {
  const css = read(CSS_KEY)
  if (css) injectCss(css)
  applyTheme(getStoredTheme())
  applyFontScale(getStoredFontScale())
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system')
      window.dispatchEvent(new CustomEvent('themechange'))
    }
  })
}
