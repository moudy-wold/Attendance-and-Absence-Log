import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { listEmployees } from '../../../api'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { TextField } from '../../Global/TextField'
import { FilterChips } from '../../Global/FilterChips'
import { Badge } from '../../Global/Badge'
import { tw } from '../../../lib/tw'

type TriState = 'all' | 'yes' | 'no'

export function AdminEmployeesScreenContent() {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<User[] | null>(null)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [regularFilter, setRegularFilter] = useState<TriState>('all')
  const [activeFilter, setActiveFilter] = useState<TriState>('all')

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setEmployees(null)

    listEmployees({
      page: 1,
      search: search || undefined,
      is_regular: regularFilter === 'all' ? undefined : regularFilter === 'yes',
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        if (cancelled) return
        setEmployees(data.results.map(mapUser))
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
  }, [search, regularFilter, activeFilter, t])

  const loadMore = useCallback(() => {
    if (!hasNext || isLoadingMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    listEmployees({
      page: nextPage,
      search: search || undefined,
      is_regular: regularFilter === 'all' ? undefined : regularFilter === 'yes',
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        setEmployees((prev) => [...(prev ?? []), ...data.results.map(mapUser)])
        setHasNext(Boolean(data.next))
        setPage(nextPage)
      })
      .catch((error) =>
        Toast.show({ type: 'error', text1: extractApiError(error, t('Something went wrong, please try again')) }),
      )
      .finally(() => setIsLoadingMore(false))
  }, [hasNext, isLoadingMore, page, search, regularFilter, activeFilter, t])

  return (
    <View style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}>
      <View style={tw`flex-row items-center gap-3 px-5 pb-4`}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={tw`text-sm text-neutral-500`}>{t('Back')}</Text>
        </Pressable>
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>{t('Employees')}</Text>
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
          label={t('Type')}
          value={regularFilter}
          onChange={setRegularFilter}
          options={[
            { value: 'all', label: t('All') },
            { value: 'yes', label: t('Regular') },
            { value: 'no', label: t('Irregular') },
          ]}
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

      {employees === null ? (
        <ActivityIndicator style={tw`mt-10`} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={tw`gap-2 px-5 pb-10`}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          ListEmptyComponent={
            <Text style={tw`mt-10 text-center text-sm text-neutral-400`}>{t('No employees yet')}</Text>
          }
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={tw`py-4`} /> : null}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/admin-employees/${item.id}`)}
              style={tw`flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900`}
            >
              <View style={tw`flex-1 gap-1`}>
                <Text style={tw`text-sm font-medium text-neutral-800 dark:text-neutral-100`}>{item.fullName}</Text>
                <Text style={tw`text-xs text-neutral-500`}>{item.phone || '—'}</Text>
              </View>
              <View style={tw`items-end gap-1.5`}>
                <Badge tone={item.isRegular ? 'green' : 'amber'}>{item.isRegular ? t('Regular') : t('Irregular')}</Badge>
                <Badge tone={item.isActive ? 'green' : 'red'}>{item.isActive ? t('Active') : t('Suspended')}</Badge>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}
