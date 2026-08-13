import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { getMyAttendance, type RawAttendance } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { tw } from '../../../lib/tw'

function formatTime(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(iso),
  )
}

export function HistoryScreenContent() {
  const { t, i18n } = useTranslation()
  const [records, setRecords] = useState<RawAttendance[] | null>(null)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    getMyAttendance(1)
      .then(({ data }) => {
        setRecords(data.results)
        setHasNext(Boolean(data.next))
        setPage(1)
      })
      .catch((error) => Toast.show({ type: 'error', text1: extractApiError(error, t('common.unexpectedError')) }))
  }, [t])

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    getMyAttendance(nextPage)
      .then(({ data }) => {
        setRecords((prev) => [...(prev ?? []), ...data.results])
        setHasNext(Boolean(data.next))
        setPage(nextPage)
      })
      .catch((error) => Toast.show({ type: 'error', text1: extractApiError(error, t('common.unexpectedError')) }))
      .finally(() => setIsLoadingMore(false))
  }, [hasNext, isLoadingMore, page, t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('common.back')}</Text>
        </Pressable>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('history.title')}</Text>
      </View>

      <FlatList
        data={records ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={tw`gap-2 px-5 pb-10`}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListEmptyComponent={
          records !== null ? (
            <Text style={tw`mt-10 text-center text-sm text-neutral-400`}>{t('history.empty')}</Text>
          ) : null
        }
        ListFooterComponent={isLoadingMore ? <ActivityIndicator style={tw`py-4`} /> : null}
        renderItem={({ item }) => (
          <View
            style={tw`flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900`}
          >
            <Text style={tw`text-sm font-medium text-neutral-800 dark:text-neutral-100`}>
              {formatDate(item.date, i18n.language)}
            </Text>
            <View style={tw`flex-row items-center gap-3`}>
              <Text style={tw`text-sm text-neutral-500`}>{formatTime(item.check_in, i18n.language)}</Text>
              <Text style={tw`text-neutral-300`}>→</Text>
              <Text style={tw`text-sm text-neutral-500`}>
                {item.check_out ? formatTime(item.check_out, i18n.language) : t('history.open')}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}
