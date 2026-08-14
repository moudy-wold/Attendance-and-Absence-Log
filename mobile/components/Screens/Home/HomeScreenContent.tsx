import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'
import { tw } from '../../../lib/tw'

/** The logged-in employee's own home screen — Scan / History / Stats. Admins get AdminHomeScreenContent instead. */
export function HomeScreenContent() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <View style={tw`flex-1 gap-6 bg-neutral-50 p-5 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{user?.fullName}</Text>
        <LanguageSwitcher />
      </View>

      <Text style={tw`text-sm text-neutral-500`}>
        {user?.isRegular ? t('Regular') : t('Irregular')}
        {user?.phone ? ` · ${user.phone}` : ''}
      </Text>

      <View style={tw`gap-3`}>
        <Button onPress={() => router.push('/scan')}>{t('Scan attendance code')}</Button>
        <Button variant="secondary" onPress={() => router.push('/history')}>
          {t('My attendance')}
        </Button>
        <Button variant="secondary" onPress={() => router.push('/stats')}>
          {t('My statistics')}
        </Button>
      </View>

      <Button style={tw`mt-auto self-start px-4`} onPress={logout}>
        {t('Sign out')}
      </Button>
    </View>
  )
}
