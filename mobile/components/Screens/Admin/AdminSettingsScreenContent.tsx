import { useEffect, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getSystemSettings, type SystemSettings } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { tw } from '../../../lib/tw'

function SettingRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={tw`flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900`}
    >
      <Text style={tw`text-sm text-neutral-700 dark:text-neutral-200`}>{label}</Text>
      <Text style={tw`text-sm font-semibold text-neutral-900 dark:text-white`}>{value}</Text>
    </View>
  )
}

export function AdminSettingsScreenContent() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    getSystemSettings()
      .then(({ data }) => setSettings(data))
      .catch((error) =>
        Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) }),
      )
  }, [t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('Back')}</Text>
        </Pressable>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('Settings')}</Text>
      </View>

      {!settings ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <View style={tw`gap-2.5 px-5 pb-10`}>
          <SettingRow label={t('QR code lifetime (seconds)')} value={settings.qr_token_lifetime_seconds} />
          <SettingRow
            label={t('Minimum session duration (seconds)')}
            value={settings.min_session_duration_seconds}
          />
          <SettingRow label={t('Work start time')} value={settings.work_start_time.slice(0, 5)} />
        </View>
      )}
    </View>
  )
}
