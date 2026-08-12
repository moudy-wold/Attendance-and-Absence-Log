import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'
import { tw } from '../../../lib/tw'

export function HomeScreenContent() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <View style={tw`flex-1 gap-6 bg-neutral-50 p-5 pt-16 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>
          {user?.fullName}
        </Text>
        <LanguageSwitcher />
      </View>
      <Text style={tw`text-sm text-neutral-500`}>
        {user?.isAdmin ? 'Admin' : 'Employee'} · {user?.phone}
      </Text>
      <Button style={tw`self-start px-4`} onPress={logout}>
        {t('auth.logout')}
      </Button>
    </View>
  )
}
