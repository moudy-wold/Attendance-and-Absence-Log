import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'
import { tw } from '../../../lib/tw'

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
        {user?.isEmployee
          ? user.isRegular
            ? t('home.regular')
            : t('home.irregular')
          : t('home.roleAdmin')}
        {user?.phone ? ` · ${user.phone}` : ''}
      </Text>

      {user?.isEmployee ? (
        <View style={tw`gap-3`}>
          <Button onPress={() => router.push('/scan')}>{t('home.scan')}</Button>
          <Button variant="secondary" onPress={() => router.push('/history')}>
            {t('home.history')}
          </Button>
        </View>
      ) : (
        <View style={tw`rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
          <Text style={tw`text-sm text-neutral-500`}>{t('home.viewOnlyNotice')}</Text>
        </View>
      )}

      <Button style={tw`mt-auto self-start px-4`} onPress={logout}>
        {t('auth.logout')}
      </Button>
    </View>
  )
}
