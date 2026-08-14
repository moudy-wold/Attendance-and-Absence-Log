import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getAdminStatsOverview, type AdminStatsOverview } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { StatCard } from '../../Global/StatCard'
import { DailyBarChart } from '../../Global/DailyBarChart'
import { RankedBarList } from '../../Global/RankedBarList'
import { useAuth } from '../../../context/authContextValue'
import { tw } from '../../../lib/tw'

const BLUE = '#2a78d6'
const ORANGE = '#eb6834'
const AQUA = '#1baf7a'

function monthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(year, month - 1, 1))
}

export function AdminHomeScreenContent() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [stats, setStats] = useState<AdminStatsOverview | null>(null)

  useEffect(() => {
    let cancelled = false
    setStats(null)

    getAdminStatsOverview(year, month)
      .then(({ data }) => {
        if (!cancelled) setStats(data)
      })
      .catch((error) => {
        if (!cancelled) {
          Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) })
        }
      })

    return () => {
      cancelled = true
    }
  }, [year, month, t])

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  return (
    <ScrollView style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`} contentContainerStyle={tw`gap-5 p-5 pb-10`}>
      <View style={tw`flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{user?.fullName}</Text>
          <Text style={tw`text-xs text-neutral-500`}>
            {t('Admin')} · {t('View only')}
          </Text>
        </View>
        <LanguageSwitcher />
      </View>

      <View style={tw`flex-row gap-2`}>
        <Button variant="secondary" style={tw`flex-1`} onPress={() => router.push('/admin-employees')}>
          {t('Employees')}
        </Button>
        <TouchableOpacity style={[tw`flex-1 border border-gray-200 bg-white rounded-lg items-center justify-center text-center`, { textAlign: "center" }]} onPress={() => router.push('/admin-entry-accounts')}>
          <Text style={tw`text-sm text-center font-medium text-neutral-800 dark:text-neutral-100`}>
            {t('Kiosk accounts')}
          </Text>
        </TouchableOpacity>
        <Button variant="secondary" style={tw`flex-1`} onPress={() => router.push('/admin-settings')}>
          {t('Settings')}
        </Button>
      </View>

      <View style={tw`flex-row items-center justify-center gap-4`}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={10}>
          <Text style={tw`text-lg text-neutral-500`}>‹</Text>
        </Pressable>
        <Text style={tw`text-sm font-medium text-neutral-800 dark:text-neutral-100`}>
          {monthLabel(year, month, i18n.language)}
        </Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={10}>
          <Text style={tw`text-lg text-neutral-500`}>›</Text>
        </Pressable>
      </View>

      {!stats ? (
        <ActivityIndicator style={tw`mt-6`} />
      ) : (
        <>
          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            <StatCard label={t('Attendance rate')} value={`${stats.attendance_rate}%`} />
            <StatCard label={t('Total employees')} value={stats.total_employees} />
            <StatCard label={t('Total late minutes')} value={stats.total_late_minutes} />
            <StatCard label={t('Total absent days')} value={stats.total_absent_days} />
            <StatCard label={t('Total early leave minutes')} value={stats.total_early_leave_minutes} />
            <StatCard label={t('Regular')} value={stats.regular_count} />
            <StatCard label={t('Irregular')} value={stats.irregular_count} />
            <StatCard label={t('Active')} value={stats.active_count} />
            <StatCard label={t('Suspended')} value={stats.suspended_count} />
            <StatCard label={t('Kiosk accounts')} value={stats.entry_account_count} />
            <StatCard label={t('Working days')} value={stats.working_days} />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('Daily attendance trend')}
            </Text>
            <DailyBarChart
              data={stats.daily_trend.map((point) => ({ date: point.date, value: point.present_count }))}
              emptyLabel={t('No data')}
              color={BLUE}
            />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('Most late employees')}
            </Text>
            <RankedBarList
              items={stats.top_late.filter((item) => item.value > 0)}
              emptyLabel={t('No data')}
              color={BLUE}
            />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('Most absent employees')}
            </Text>
            <RankedBarList
              items={stats.top_absent.filter((item) => item.value > 0)}
              emptyLabel={t('No data')}
              color={ORANGE}
            />
          </View>

          <View style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}>
            <Text style={tw`text-sm font-semibold text-neutral-800 dark:text-neutral-100`}>
              {t('Most early leavers')}
            </Text>
            <RankedBarList
              items={stats.top_early_leave.filter((item) => item.value > 0)}
              emptyLabel={t('No data')}
              color={AQUA}
            />
          </View>
        </>
      )}

      <Button style={tw`self-start px-4`} onPress={logout}>
        {t('Sign out')}
      </Button>
    </ScrollView>
  )
}
