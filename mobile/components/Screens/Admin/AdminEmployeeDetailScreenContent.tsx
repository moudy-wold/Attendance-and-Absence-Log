import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router, useLocalSearchParams } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getEmployee, type RawEmployeeAttendance } from '../../../api'
import { mapUser } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { Badge } from '../../Global/Badge'
import { tw } from '../../../lib/tw'

function monthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(year, month - 1, 1))
}

function formatTime(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function AdminEmployeeDetailScreenContent() {
  const { t, i18n } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const employeeId = Number(id)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<RawEmployeeAttendance | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)

    getEmployee(employeeId, year, month)
      .then(({ data }) => {
        if (!cancelled) setData(data)
      })
      .catch((error) =>
        Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) }),
      )

    return () => {
      cancelled = true
    }
  }, [employeeId, year, month, t])

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  const employee = data ? mapUser(data) : null

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950 pt-3`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('Back')}</Text>
        </Pressable>
        <Text style={tw`flex-1 text-lg font-semibold text-neutral-900 dark:text-white`} numberOfLines={1}>
          {employee?.fullName ?? '…'}
        </Text>
      </View>

      {!employee || !data ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <ScrollView contentContainerStyle={tw`gap-5 px-5 pb-10`}>
          <View
            style={tw`gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}
          >
            <Text style={tw`text-sm text-neutral-500`}>
              {employee.username} · {employee.phone || '—'}
            </Text>
            <View style={tw`flex-row gap-2`}>
              <Badge tone={employee.isRegular ? 'green' : 'amber'}>
                {employee.isRegular ? t('Regular') : t('Irregular')}
              </Badge>
              <Badge tone={employee.isActive ? 'green' : 'red'}>
                {employee.isActive ? t('Active') : t('Suspended')}
              </Badge>
            </View>
            <Text style={tw`text-xs text-neutral-500`}>
              {employee.deviceId ? t('Bound to a device') : t('Not bound to any device yet')}
            </Text>
          </View>

          <View style={tw`gap-3`}>
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

            {data.attendance.length === 0 ? (
              <Text style={tw`py-6 text-center text-sm text-neutral-400`}>
                {t('No attendance records for this month')}
              </Text>
            ) : (
              <View style={tw`gap-2`}>
                {data.attendance.map((record) => (
                  <View
                    key={record.id}
                    style={tw`flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900`}
                  >
                    <Text style={tw`text-sm font-medium text-neutral-800 dark:text-neutral-100`}>
                      {formatDate(record.date, i18n.language)}
                    </Text>
                    <View style={tw`flex-row items-center gap-3`}>
                      <Text style={tw`text-sm text-neutral-500`}>{formatTime(record.check_in, i18n.language)}</Text>
                      <Text style={tw`text-neutral-300`}>→</Text>
                      <Text style={tw`text-sm text-neutral-500`}>
                        {record.check_out ? formatTime(record.check_out, i18n.language) : t('In progress')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
