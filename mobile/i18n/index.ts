import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import ar from './locales/ar'
import en from './locales/en'
import tr from './locales/tr'

export const supportedLanguages = ['ar', 'tr', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const rtlLanguages: SupportedLanguage[] = ['ar']

export function isRtl(language: string) {
  return rtlLanguages.includes(language as SupportedLanguage)
}

function detectDeviceLanguage(): SupportedLanguage {
  const deviceLanguage = Localization.getLocales()[0]?.languageCode
  return (supportedLanguages as readonly string[]).includes(deviceLanguage ?? '')
    ? (deviceLanguage as SupportedLanguage)
    : 'ar'
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'ar',
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  // Keys are literal English sentences (e.g. "Camera access is needed to scan
  // the attendance code."), not dot-namespaced paths — disable i18next's
  // default splitting so punctuation inside a key is never misread as nesting.
  keySeparator: false,
  nsSeparator: false,
})

export default i18n
