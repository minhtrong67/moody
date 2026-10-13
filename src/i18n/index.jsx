import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import vi from './vi'
import en from './en'

const DICTS = { vi, en }
const LOCALES = { vi: 'vi-VN', en: 'en-US' }
const LANG_KEY = 'lang'

export const LANGUAGES = [
  { key: 'vi', label: 'Tiếng Việt' },
  { key: 'en', label: 'English' }
]

export function detectLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'vi' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  return (navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  // Đồng bộ <html lang>, tiêu đề và mô tả trang theo ngôn ngữ (có lợi cho SEO / trình đọc màn hình).
  useEffect(() => {
    const dict = DICTS[lang]
    document.documentElement.lang = lang
    document.title = dict['meta.title']
    document.querySelector('meta[name="description"]')?.setAttribute('content', dict['meta.description'])
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'vi' ? 'vi_VN' : 'en_US')
  }, [lang])

  const setLang = useCallback((next) => {
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* ignore */
    }
    setLangState(next)
  }, [])

  const value = useMemo(() => {
    const dict = DICTS[lang]
    // t('key', { n: 3 }) — thay {n} trong chuỗi; thiếu khóa → thử tiếng Việt rồi trả về chính khóa.
    const t = (key, params) => {
      let str = dict[key] ?? vi[key] ?? key
      if (params && typeof str === 'string') {
        for (const [k, v] of Object.entries(params)) str = str.replaceAll(`{${k}}`, v)
      }
      return str
    }
    return { t, lang, setLang, locale: LOCALES[lang] }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
