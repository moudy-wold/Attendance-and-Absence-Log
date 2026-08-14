import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getMyStats, type EmployeeStats } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { StatCard } from '../../Global/StatCard'
import { DailyBarChart } from '../../Global/DailyBarChart'
import { tw } from '../../../lib/tw'

export function StatsScreenContent() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<EmployeeStats | null>(null)

  useEffect(() => {
    getMyStats()
      .then(({ data }) => setStats(data))
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
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('My statistics')}</Text>
      </View>

      {!stats ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <ScrollView contentContainerStyle={tw`gap-5 px-5 pb-10`}>
          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            <StatCard label={t('Days present')} value={stats.present_days} />
            <StatCard label={t('Days absent')} value={stats.absent_days} />
            <StatCard label={t('Late minutes')} value={stats.late_minutes} />
            <StatCard label={t('On-time rate')} value={`${stats.on_time_rate}%`} />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('Late minutes per day')}
            </Text>
            <DailyBarChart
              data={stats.daily_late_minutes.map((point) => ({ date: point.date, value: point.late_minutes }))}
              emptyLabel={t('No attendance recorded yet this month')}
            />
          </View>
        </ScrollView>
      )}
    </View>
  )
}
