import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ar from './locales/ar'
import en from './locales/en'
import tr from './locales/tr'

export const supportedLanguages = ['ar', 'tr', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const rtlLanguages: SupportedLanguage[] = ['ar']

export function isRtl(language: string) {
  return rtlLanguages.includes(language as SupportedLanguage)
}

export function applyDocumentDirection(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      tr: { translation: tr },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    // Keys are literal English sentences (e.g. "If left empty, the phone number
    // will be used as the password."), not dot-namespaced paths — disable
    // i18next's default splitting so punctuation inside a key is never
    // misread as nesting.
    keySeparator: false,
    nsSeparator: false,
  })

i18n.on('languageChanged', applyDocumentDirection)
applyDocumentDirection(i18n.resolvedLanguage ?? 'ar')

export default i18n
