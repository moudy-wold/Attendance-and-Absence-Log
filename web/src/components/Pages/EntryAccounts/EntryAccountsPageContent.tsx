import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listEntryUsers, updateUser } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Badge } from '../../Global/Badge'
import { Button } from '../../Global/Button'
import { TextField } from '../../Global/TextField'
import { SelectField } from '../../Global/Select'

type TriState = 'all' | 'yes' | 'no'

export function EntryAccountsPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [entryUsers, setEntryUsers] = useState<User[] | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<TriState>('all')
  const [pendingId, setPendingId] = useState<number | null>(null)

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setEntryUsers(null)

    listEntryUsers({
      page,
      search: search || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        if (cancelled) return
        setEntryUsers(data.results.map(mapUser))
        setCount(data.count)
      })
      .catch((error) => {
        if (!cancelled) toast.error(extractApiError(error, t('common.unexpectedError')))
      })

    return () => {
      cancelled = true
    }
  }, [page, search, activeFilter, t])

  async function handleToggleActive(user: User, checked: boolean) {
    setPendingId(user.id)
    try {
      const { data } = await updateUser(user.id, { is_active: checked })
      const updated = mapUser(data)
      setEntryUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev)
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setPendingId(null)
    }
  }

  async function handleResetDevice(user: User) {
    if (!window.confirm(t('employeeDetail.resetDeviceConfirm'))) return
    setPendingId(user.id)
    try {
      const { data } = await updateUser(user.id, { device_id: null })
      const updated = mapUser(data)
      setEntryUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev)
      toast.success(t('employeeDetail.resetDeviceSuccess'))
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('entryAccounts.title')} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <TextField
                label={t('employees.search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('employees.searchPlaceholder')}
              />
            </div>
            <div className="w-40">
              <SelectField
                label={t('employees.status')}
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as TriState)
                  setPage(1)
                }}
              >
                <option value="all">{t('employees.filterAll')}</option>
                <option value="yes">{t('employees.active')}</option>
                <option value="no">{t('employees.suspended')}</option>
              </SelectField>
            </div>
          </div>
          <Button className="w-fit px-4" onClick={() => navigate('/employees/new')}>
            {t('entryAccounts.create')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <th className="px-4 py-3 text-start font-medium">{t('employees.name')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('employees.phone')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('entryAccounts.device')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('active/inactive')}</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {entryUsers === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3.5" colSpan={5}>
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {entryUsers !== null && entryUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={5}>
                    {t('entryAccounts.empty')}
                  </td>
                </tr>
              )}

              {entryUsers?.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3.5 font-medium text-neutral-800">{user.fullName}</td>
                  <td className="px-4 py-3.5 text-neutral-500">{user.phone || '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={user.deviceId ? 'green' : 'neutral'}>
                      {user.deviceId ? t('employeeDetail.deviceBound') : t('employeeDetail.deviceNotBound')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={user.isActive}
                      disabled={pendingId === user.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleActive(user, !user.isActive)
                      }}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${user.isActive ? 'bg-neutral-900' : 'bg-neutral-200'
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow transition-transform ${user.isActive ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {user.deviceId && (
                        <button
                          type="button"
                          disabled={pendingId === user.id}
                          onClick={() => handleResetDevice(user)}
                          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {t('employeeDetail.resetDevice')}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={t('entryAccounts.edit')}
                        onClick={() => navigate(`/entry-accounts/${user.id}`)}
                        className="flex  size-8 shrink-0 items-center justify-center border border-gray-200 rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
                          <path
                            d="M12.9 3.4a1.5 1.5 0 0 1 2.12 0l1.58 1.58a1.5 1.5 0 0 1 0 2.12L7.5 16.2l-3.7.8.8-3.7L12.9 3.4Z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {count > pageSize && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{t('employees.pageIndicator', { page, totalPages, count })}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
              >
                {t('employees.prevPage')}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
              >
                {t('employees.nextPage')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
