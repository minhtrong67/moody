// Trang hiển thị khi mở app (người dùng chọn trong Cài đặt). Lưu theo thiết bị.
const KEY = 'start-page'

export const START_PAGES = [
  { path: '/', key: 'nav.today' },
  { path: '/history', key: 'nav.history' },
  { path: '/stats', key: 'nav.stats' },
  { path: '/checkin', key: 'nav.newCheckin' },
  { path: '/manage/activities', key: 'nav.activities' },
  { path: '/manage/moods', key: 'nav.moods' },
  { path: '/settings', key: 'nav.settings' },
]

export function getStartPage() {
  try {
    const v = localStorage.getItem(KEY)
    if (START_PAGES.some((p) => p.path === v)) return v
  } catch {
    /* ignore */
  }
  return '/'
}

export function setStartPage(path) {
  try {
    if (path === '/') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, path)
  } catch {
    /* ignore */
  }
}
