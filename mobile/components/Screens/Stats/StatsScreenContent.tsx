import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getMyStats, type EmployeeStats } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { tw } from '../../../lib/tw'

const BAR_COLOR = '#2a78d6'
const CHART_HEIGHT = 100

function dayOfMonth(iso: string) {
  return Number(iso.slice(-2))
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={tw`w-[47%] gap-1 rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900`}
    >
      <Text style={tw`text-xs font-medium text-neutral-500`}>{label}</Text>
      <Text style={tw`text-xl font-semibold text-neutral-900 dark:text-white`}>{value}</Text>
    </View>
  )
}

function DailyLateChart({ data, emptyLabel }: { data: EmployeeStats['daily_late_minutes']; emptyLabel: string }) {
  if (data.length === 0) {
    return <Text style={tw`py-8 text-center text-sm text-neutral-400`}>{emptyLabel}</Text>
  }

  const maxValue = Math.max(1, ...data.map((point) => point.late_minutes))

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={tw`h-[${CHART_HEIGHT + 20}px] flex-row items-end gap-2.5 px-1 py-2`}>
        {data.map((point) => {
          const barHeight = Math.max(2, Math.round((point.late_minutes / maxValue) * CHART_HEIGHT))
          return (
            <View key={point.date} style={tw`items-center gap-1`}>
              <View style={tw`h-[${CHART_HEIGHT}px] w-3.5 justify-end`}>
                <View style={[tw`w-3.5 rounded-t-sm`, { height: barHeight, backgroundColor: BAR_COLOR }]} />
              </View>
              <Text style={tw`text-[9px] text-neutral-400`}>{dayOfMonth(point.date)}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

export function StatsScreenContent() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<EmployeeStats | null>(null)

  useEffect(() => {
    getMyStats()
      .then(({ data }) => setStats(data))
      .catch((error) => Toast.show({ type: 'error', text1: extractApiError(error, t('common.unexpectedError')) }))
  }, [t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('common.back')}</Text>
        </Pressable>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('stats.title')}</Text>
      </View>

      {!stats ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <ScrollView contentContainerStyle={tw`gap-5 px-5 pb-10`}>
          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            <StatCard label={t('stats.presentDays')} value={stats.present_days} />
            <StatCard label={t('stats.absentDays')} value={stats.absent_days} />
            <StatCard label={t('stats.lateMinutes')} value={stats.late_minutes} />
            <StatCard label={t('stats.onTimeRate')} value={`${stats.on_time_rate}%`} />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('stats.dailyLateTitle')}
            </Text>
            <DailyLateChart data={stats.daily_late_minutes} emptyLabel={t('stats.noData')} />
          </View>
        </ScrollView>
      )}
    </View>
  )
}
