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

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

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
  const now = new Date()
  const [exportStartDate, setExportStartDate] = useState(
    toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
  )
  const [exportEndDate, setExportEndDate] = useState(toIsoDate(now))

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
        if (!cancelled) toast.error(extractApiError(error, t('Something went wrong, please try again')))
      })

    return () => {
      cancelled = true
    }
  }, [page, search, regularFilter, activeFilter, t])

  async function handleExport() {
    if (exportStartDate > exportEndDate) {
      toast.error(t('Start date must be before or equal to the end date'))
      return
    }

    setIsExporting(true)
    try {
      const { data } = await exportAttendanceSummary({
        search: search || undefined,
        is_regular: regularFilter === 'all' ? undefined : regularFilter === 'yes',
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
        lang: i18n.language,
        start_date: exportStartDate,
        end_date: exportEndDate,
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-summary-${exportStartDate}_${exportEndDate}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(extractApiError(error, t('Something went wrong, please try again')))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('Employees')} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <TextField
                label={t('Search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('Name, username, phone or national ID')}
              />
            </div>
            <div className="w-40">
              <SelectField
                label={t('Type')}
                value={regularFilter}
                onChange={(e) => {
                  setRegularFilter(e.target.value as TriState)
                  setPage(1)
                }}
              >
                <option value="all">{t('All')}</option>
                <option value="yes">{t('Regular')}</option>
                <option value="no">{t('Irregular')}</option>
              </SelectField>
            </div>
            <div className="w-40">
              <SelectField
                label={t('Status')}
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as TriState)
                  setPage(1)
                }}
              >
                <option value="all">{t('All')}</option>
                <option value="yes">{t('Active')}</option>
                <option value="no">{t('Suspended')}</option>
              </SelectField>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-36">
              <TextField
                label={t('From')}
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="w-36">
              <TextField
                label={t('To')}
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleExport}
              loading={isExporting}
              className="w-fit px-4 text-neutral-700 ring-1 ring-neutral-200 hover:opacity-100 cursor-pointer hover:bg-neutral-600"
            >
              {t('Export to Excel')}
            </Button>
            <Button className="w-fit px-4" onClick={() => navigate('/employees/new')}>
              {t('+ New account')}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <th className="px-4 py-3 text-start font-medium">{t('Name')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('Phone')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('National ID number (TC)')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('Role')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('Type')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('Duty type')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('Status')}</th>
                <th className="px-4 py-3 text-start font-medium" >{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3.5" colSpan={8}>
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    </td>
                  </tr>
                ))}

              {employees !== null && employees.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={8}>
                    {t('No employees yet')}
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
                  <td className="px-4 py-3.5 text-neutral-500">{employee.tc || '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone="neutral">
                      {employee.isEntry ? t('Entry kiosk') : t('Employee')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {employee.isEmployee && (
                      <Badge tone={employee.isRegular ? 'green' : 'amber'}>
                        {employee.isRegular ? t('Regular') : t('Irregular')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500">{employee.type ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={employee.isActive ? 'green' : 'red'}>
                      {employee.isActive ? t('Active') : t('Suspended')}
                    </Badge>
                  </td>
                  {/* Start actions */}
                  <td className="px-4 py-3.5 text-end">
                    <div className="flex justify-start gap-2">
                      <button
                        type="button"
                        aria-label={t('Statistics')}
                        onClick={() => navigate(`/employees/${employee.id}/stats`)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[1px] border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
                          <path d="M3.5 16.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          <path d="M6 16.5v-5M10 16.5v-8M14 16.5v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label={t('Edit')}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {count > pageSize && (
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{t('Page {{page}} of {{totalPages}} · {{count}} total', { page, totalPages, count })}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
              >
                {t('Previous')}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
              >
                {t('Next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
