import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listEmployees, exportAttendanceSummary } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Badge } from '../../Global/Badge'
import { Button } from '../../Global/Button'
import { TextField } from '../../Global/TextField'
import { SelectField } from '../../Global/Select'

type TriState = 'all' | 'yes' | 'no'

export function EmployeesPageContent() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState<User[] | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [regularFilter, setRegularFilter] = useState<TriState>('all')
  const [activeFilter, setActiveFilter] = useState<TriState>('all')
  const [isExporting, setIsExporting] = useState(false)

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

  async function handleExport() {
    setIsExporting(true)
    try {
      const { data } = await exportAttendanceSummary({
        search: search || undefined,
        is_regular: regularFilter === 'all' ? undefined : regularFilter === 'yes',
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
        lang: i18n.language,
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-summary-${new Date().toISOString().slice(0, 7)}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setIsExporting(false)
    }
  }

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
          <div className="flex items-end gap-2">
            <Button
              onClick={handleExport}
              loading={isExporting}
              className="w-fit px-4 text-neutral-700 ring-1 ring-neutral-200 hover:opacity-100 hover:bg-neutral-50"
            >
              {t('employees.exportExcel')}
            </Button>
            <Button className="w-fit px-4" onClick={() => navigate('/employees/new')}>
              {t('employees.create')}
            </Button>
          </div>
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
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {employees === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3.5" colSpan={6}>
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {employees !== null && employees.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={6}>
                    {t('employees.empty')}
                  </td>
                </tr>
              )}

              {employees?.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
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
                  <td className="px-4 py-3.5 text-end">
                    <button
                      type="button"
                      aria-label={t('employees.edit')}
                      onClick={() => navigate(`/employees/${employee.id}`)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[1px] border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
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
