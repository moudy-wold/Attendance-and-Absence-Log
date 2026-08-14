import { useEffect, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router, useLocalSearchParams } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getUser } from '../../../api'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { Badge } from '../../Global/Badge'
import { tw } from '../../../lib/tw'

export function AdminEntryAccountDetailScreenContent() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const accountId = Number(id)

  const [account, setAccount] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false
    setAccount(null)

    getUser(accountId)
      .then(({ data }) => {
        if (!cancelled) setAccount(mapUser(data))
      })
      .catch((error) =>
        Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) }),
      )

    return () => {
      cancelled = true
    }
  }, [accountId, t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('Back')}</Text>
        </Pressable>
        <Text style={tw`flex-1 text-lg font-semibold text-neutral-900 dark:text-white`} numberOfLines={1}>
          {account?.fullName ?? '…'}
        </Text>
      </View>

      {!account ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <View style={tw`gap-5 px-5 pb-10`}>
          <View
            style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}
          >
            <Text style={tw`text-sm text-neutral-500`}>
              {account.username} · {account.phone || '—'}
            </Text>
            {account.email && <Text style={tw`text-sm text-neutral-500`}>{account.email}</Text>}
            <Badge tone={account.isActive ? 'green' : 'red'}>{account.isActive ? t('Active') : t('Suspended')}</Badge>
            <Text style={tw`text-xs text-neutral-500`}>
              {account.deviceId ? t('Bound to a device') : t('Not bound to any device yet')}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
