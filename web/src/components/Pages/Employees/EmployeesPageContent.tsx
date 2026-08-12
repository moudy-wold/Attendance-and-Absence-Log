import { useEffect, useMemo, useState } from 'react'
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

export function EmployeesPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState<User[] | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    listEmployees()
      .then(({ data }) => {
        if (!cancelled) setEmployees(data.map(mapUser))
      })
      .catch((error) => {
        if (!cancelled) toast.error(extractApiError(error, t('common.unexpectedError')))
      })

    return () => {
      cancelled = true
    }
  }, [t])

  const filtered = useMemo(() => {
    if (!employees) return []
    const query = search.trim().toLowerCase()
    if (!query) return employees
    return employees.filter(
      (employee) =>
        employee.fullName.toLowerCase().includes(query) ||
        employee.username.toLowerCase().includes(query) ||
        employee.phone.toLowerCase().includes(query),
    )
  }, [employees, search])

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('employees.title')} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-xs">
            <TextField
              label={t('employees.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('employees.searchPlaceholder')}
            />
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

              {employees !== null && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={5}>
                    {t('employees.empty')}
                  </td>
                </tr>
              )}

              {filtered.map((employee) => (
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
      </div>
    </div>
  )
}
