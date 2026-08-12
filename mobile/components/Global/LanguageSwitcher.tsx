import { View, Text, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tw } from '../../lib/tw'
import { supportedLanguages, type SupportedLanguage } from '../../i18n'

const labels: Record<SupportedLanguage, string> = {
  ar: 'العربية',
  tr: 'Türkçe',
  en: 'English',
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <View style={tw`flex-row gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700`}>
      {supportedLanguages.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <Pressable
            key={lng}
            onPress={() => i18n.changeLanguage(lng)}
            style={tw`rounded-md px-2.5 py-1 ${active ? 'bg-neutral-900 dark:bg-white' : ''}`}
          >
            <Text
              style={tw`text-xs font-medium ${
                active ? 'text-white dark:text-neutral-900' : 'text-neutral-500'
              }`}
            >
              {labels[lng]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
