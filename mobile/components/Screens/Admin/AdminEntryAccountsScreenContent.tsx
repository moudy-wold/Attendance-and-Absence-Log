import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { listEntryUsers } from '../../../api'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { TextField } from '../../Global/TextField'
import { FilterChips } from '../../Global/FilterChips'
import { Badge } from '../../Global/Badge'
import { tw } from '../../../lib/tw'

type TriState = 'all' | 'yes' | 'no'

export function AdminEntryAccountsScreenContent() {
  const { t } = useTranslation()
  const [entryUsers, setEntryUsers] = useState<User[] | null>(null)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<TriState>('all')

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setEntryUsers(null)

    listEntryUsers({
      page: 1,
      search: search || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        if (cancelled) return
        setEntryUsers(data.results.map(mapUser))
        setHasNext(Boolean(data.next))
        setPage(1)
      })
      .catch((error) => {
        if (!cancelled) {
          Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) })
        }
      })

    return () => {
      cancelled = true
    }
  }, [search, activeFilter, t])

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    listEntryUsers({
      page: nextPage,
      search: search || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        setEntryUsers((prev) => [...(prev ?? []), ...data.results.map(mapUser)])
        setHasNext(Boolean(data.next))
        setPage(nextPage)
      })
      .catch((error) =>
        Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) }),
      )
      .finally(() => setIsLoadingMore(false))
  }, [hasNext, isLoadingMore, page, search, activeFilter, t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950 pt-3`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('Back')}</Text>
        </Pressable>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('Kiosk accounts')}</Text>
      </View>

      <View style={tw`gap-3 px-5 pb-3`}>
        <TextField
          label={t('Search')}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={t('Name, username or phone')}
          autoCapitalize="none"
        />
        <FilterChips
          label={t('Status')}
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: 'all', label: t('All') },
            { value: 'yes', label: t('Active') },
            { value: 'no', label: t('Suspended') },
          ]}
        />
      </View>

      {entryUsers === null ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <FlatList
          data={entryUsers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={tw`gap-2 px-5 pb-10`}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          ListEmptyComponent={
            <Text style={tw`mt-10 text-center text-sm text-neutral-400`}>{t('No kiosk accounts yet')}</Text>
          }
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={tw`py-4`} /> : null}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/admin-entry-accounts/${item.id}`)}
              style={tw`flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900`}
            >
              <View style={tw`flex-1 gap-1`}>
                <Text style={tw`text-sm font-medium text-neutral-800 dark:text-neutral-100`}>{item.fullName}</Text>
                <Text style={tw`text-xs text-neutral-500`}>{item.phone || '—'}</Text>
                {item.tc !== null && <Text style={tw`text-xs text-neutral-500`}>{t('TC')}: {item.tc}</Text>}
              </View>
              <View style={tw`items-end gap-1.5`}>
                <Badge tone={item.deviceId ? 'green' : 'neutral'}>
                  {item.deviceId ? t('Bound to a device') : t('Not bound to any device yet')}
                </Badge>
                <Badge tone={item.isActive ? 'green' : 'red'}>{item.isActive ? t('Active') : t('Suspended')}</Badge>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}
