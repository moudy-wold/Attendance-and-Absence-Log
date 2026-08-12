import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getEmployee, updateUser, exportAttendance } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { mapAttendance, type Attendance } from '../../../types/attendance'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Badge } from '../../Global/Badge'
import { Switch } from '../../Global/Switch'
import { Button } from '../../Global/Button'

function monthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, 1),
  )
}

function formatTime(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function EmployeeDetailPageContent() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [employee, setEmployee] = useState<User | null>(null)
  const [attendance, setAttendance] = useState<Attendance[] | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const load = useCallback(() => {
    setAttendance(null)
    getEmployee(employeeId, year, month)
      .then(({ data }) => {
        const { attendance: rawAttendance, ...rawUser } = data
        setEmployee(mapUser(rawUser))
        setAttendance(rawAttendance.map(mapAttendance))
      })
      .catch((error) => toast.error(extractApiError(error, t('common.unexpectedError'))))
  }, [employeeId, year, month, t])

  useEffect(() => {
    load()
  }, [load])

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  async function handleUpdate(payload: Parameters<typeof updateUser>[1]) {
    if (!employee) return
    try {
      const { data } = await updateUser(employee.id, payload)
      setEmployee(mapUser(data))
      toast.success(t('employeeDetail.updateSuccess'))
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    }
  }

  async function handleResetDevice() {
    if (!window.confirm(t('employeeDetail.resetDeviceConfirm'))) return
    await handleUpdate({ device_id: null })
    toast.success(t('employeeDetail.resetDeviceSuccess'))
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const { data } = await exportAttendance(year, month)
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${employee?.username ?? employeeId}-${year}-${month}.xlsx`
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
      <AdminHeader title={employee?.fullName ?? '…'} onBack={() => navigate('/')} />

      {!employee ? (
        <div className="p-6">
          <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">{employee.fullName}</h2>
              <Badge tone="neutral">{employee.isEntry ? t('employees.roleEntry') : t('employees.roleEmployee')}</Badge>
            </div>
            <p className="text-sm text-neutral-500">
              {employee.username} · {employee.phone || '—'}
            </p>

            <Switch
              label={t('employeeDetail.activeToggleLabel')}
              description={t('employeeDetail.activeToggleDescription')}
              checked={employee.isActive}
              onChange={(checked) => handleUpdate({ is_active: checked })}
            />

            {employee.isEmployee && (
              <Switch
                label={t('employees.regular')}
                description={t('employeeDetail.regularToggleDescription')}
                checked={employee.isRegular}
                onChange={(checked) => handleUpdate({ is_regular: checked })}
              />
            )}

            <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-neutral-800">{t('employeeDetail.deviceSection')}</span>
                <span className="text-xs text-neutral-500">
                  {employee.deviceId ? t('employeeDetail.deviceBound') : t('employeeDetail.deviceNotBound')}
                </span>
              </span>
              {employee.deviceId && (
                <button
                  type="button"
                  onClick={handleResetDevice}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  {t('employeeDetail.resetDevice')}
                </button>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label={t('common.back')}
                  className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-3.5 rtl:-scale-x-100" aria-hidden="true">
                    <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="w-32 text-center text-sm font-medium text-neutral-800">
                  {monthLabel(year, month, i18n.language)}
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label={t('common.back')}
                  className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-3.5 -scale-x-100 rtl:scale-x-100" aria-hidden="true">
                    <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <Button
                onClick={handleExport}
                loading={isExporting}
                className="w-fit bg-white px-3 py-1.5 text-neutral-700 ring-1 ring-neutral-200 hover:opacity-100 hover:bg-neutral-50"
              >
                {t('employeeDetail.export')}
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-neutral-100">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                    <th className="px-3 py-2.5 text-start font-medium">{t('employeeDetail.tableDate')}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t('employeeDetail.tableCheckIn')}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t('employeeDetail.tableCheckOut')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance === null &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-50 last:border-0">
                        <td className="px-3 py-3" colSpan={3}>
                          <div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
                        </td>
                      </tr>
                    ))}

                  {attendance !== null && attendance.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-sm text-neutral-400" colSpan={3}>
                        {t('employeeDetail.noAttendance')}
                      </td>
                    </tr>
                  )}

                  {attendance?.map((record) => (
                    <tr key={record.id} className="border-b border-neutral-50 last:border-0">
                      <td className="px-3 py-2.5 text-neutral-700">{formatDate(record.date, i18n.language)}</td>
                      <td className="px-3 py-2.5 text-neutral-700">{formatTime(record.checkIn, i18n.language)}</td>
                      <td className="px-3 py-2.5 text-neutral-700">{formatTime(record.checkOut, i18n.language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
