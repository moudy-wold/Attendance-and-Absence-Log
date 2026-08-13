import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listEmployees } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Badge } from '../../Global/Badge'
import { Button } from '../../Global/Button'
import { TextField } from '../../Global/TextField'
import { SelectField } from '../../Global/Select'

type TriState = 'all' | 'yes' | 'no'

export function EmployeesPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState<User[] | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [regularFilter, setRegularFilter] = useState<TriState>('all')
  const [activeFilter, setActiveFilter] = useState<TriState>('all')

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  // Debounce the search box before it hits the API.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setEmployees(null)

    listEmployees({
      page,
      search: search || undefined,
      is_regular: regularFilter === 'all' ? undefined : regularFilter === 'yes',
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
    })
      .then(({ data }) => {
        if (cancelled) return
        setEmployees(data.results.map(mapUser))
        setCount(data.count)
      })
      .catch((error) => {
        if (!cancelled) toast.error(extractApiError(error, t('common.unexpectedError')))
      })

    return () => {
      cancelled = true
    }
  }, [page, search, regularFilter, activeFilter, t])

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('employees.title')} />

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
                label={t('employees.type')}
                value={regularFilter}
                onChange={(e) => {
                  setRegularFilter(e.target.value as TriState)
                  setPage(1)
                }}
              >
                <option value="all">{t('employees.filterAll')}</option>
                <option value="yes">{t('employees.regular')}</option>
                <option value="no">{t('employees.irregular')}</option>
              </SelectField>
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
            {t('employees.create')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <th className="px-4 py-3 text-start font-medium">{t('employees.name')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('employees.phone')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('employees.role')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('employees.type')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('employees.status')}</th>
              </tr>
            </thead>
            <tbody>
              {employees === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3.5" colSpan={5}>
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {employees !== null && employees.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={5}>
                    {t('employees.empty')}
                  </td>
                </tr>
              )}

              {employees?.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => navigate(`/employees/${employee.id}`)}
                  className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3.5 font-medium text-neutral-800">{employee.fullName}</td>
                  <td className="px-4 py-3.5 text-neutral-500">{employee.phone || '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone="neutral">
                      {employee.isEntry ? t('employees.roleEntry') : t('employees.roleEmployee')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {employee.isEmployee && (
                      <Badge tone={employee.isRegular ? 'green' : 'amber'}>
                        {employee.isRegular ? t('employees.regular') : t('employees.irregular')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={employee.isActive ? 'green' : 'red'}>
                      {employee.isActive ? t('employees.active') : t('employees.suspended')}
                    </Badge>
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
