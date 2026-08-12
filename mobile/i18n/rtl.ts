import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import * as Updates from 'expo-updates'
import { useTranslation } from 'react-i18next'
import { isRtl } from './index'

// Native layout direction only takes effect after a full reload, unlike
// react-i18next's own state which updates immediately.
export async function syncLayoutDirection(language: string) {
  const shouldBeRtl = isRtl(language)
  if (I18nManager.isRTL === shouldBeRtl) return

  I18nManager.allowRTL(true)
  I18nManager.forceRTL(shouldBeRtl)

  if (Updates.isEnabled) {
    await Updates.reloadAsync()
  }
}

export function useSyncLayoutDirection() {
  const { i18n } = useTranslation()

  useEffect(() => {
    syncLayoutDirection(i18n.language)
    i18n.on('languageChanged', syncLayoutDirection)
    return () => {
      i18n.off('languageChanged', syncLayoutDirection)
    }
  }, [i18n])
}
