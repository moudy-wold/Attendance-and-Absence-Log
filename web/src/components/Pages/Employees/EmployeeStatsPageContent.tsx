import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getEmployee, exportEmployeeAttendance } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { mapAttendance, type Attendance } from '../../../types/attendance'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Button } from '../../Global/Button'
import { TextField } from '../../Global/TextField'

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

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3.5">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span className="text-xl font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

interface MonthStats {
  presentDays: number
  absentDays: number
  lateMinutes: number
  earlyLeaveMinutes: number
}

export function EmployeeStatsPageContent() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  // نطاق تصدير مستقل عن الشهر المعروض على الشاشة — يبدأ بحدود الشهر الحالي لكن يمكن للأدمن تغييره.
  const [exportStartDate, setExportStartDate] = useState(toIsoDate(new Date(year, month - 1, 1)))
  const [exportEndDate, setExportEndDate] = useState(toIsoDate(now))

  const [employee, setEmployee] = useState<User | null>(null)
  const [attendance, setAttendance] = useState<Attendance[] | null>(null)
  const [stats, setStats] = useState<MonthStats | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const load = useCallback(() => {
    setAttendance(null)
    setStats(null)
    getEmployee(employeeId, year, month)
      .then(({ data }) => {
        const {
          attendance: rawAttendance,
          present_days,
          absent_days,
          late_minutes,
          early_leave_minutes,
          ...rawUser
        } = data
        setEmployee(mapUser(rawUser))
        setAttendance(rawAttendance.map(mapAttendance))
        setStats({
          presentDays: present_days,
          absentDays: absent_days,
          lateMinutes: late_minutes,
          earlyLeaveMinutes: early_leave_minutes,
        })
      })
      .catch((error) => toast.error(extractApiError(error, t('Something went wrong, please try again'))))
  }, [employeeId, year, month, t])

  useEffect(() => {
    load()
  }, [load])

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
    setExportStartDate(toIsoDate(next))
    setExportEndDate(toIsoDate(new Date(next.getFullYear(), next.getMonth() + 1, 0)))
  }

  async function handleExport() {
    if (exportStartDate > exportEndDate) {
      toast.error(t('Start date must be before or equal to the end date'))
      return
    }

    setIsExporting(true)
    try {
      const { data } = await exportEmployeeAttendance(employeeId, exportStartDate, exportEndDate)
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${employee?.username ?? employeeId}-${exportStartDate}_${exportEndDate}.xlsx`
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
      <AdminHeader title={employee?.fullName ?? '…'} onBack={() => navigate('/employees')} />

      {!employee ? (
        <div className="p-6">
          <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label={t('Back')}
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
                  aria-label={t('Next')}
                  className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-3.5 -scale-x-100 rtl:scale-x-100" aria-hidden="true">
                    <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
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
                className="w-fit px-3 py-1.5 text-neutral-700 ring-1 ring-neutral-200 hover:opacity-100 cursor-pointer hover:bg-neutral-600"
              >
                {t('Export to Excel')}
              </Button>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label={t('Days present')} value={stats.presentDays} />
                <StatCard label={t('Days absent')} value={stats.absentDays} />
                <StatCard label={t('Late minutes')} value={stats.lateMinutes} />
                <StatCard label={t('Early leave minutes')} value={stats.earlyLeaveMinutes} />
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-neutral-100">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                    <th className="px-3 py-2.5 text-start font-medium">{t('Date')}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t('Check in')}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t('Check out')}</th>
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
                        {t('No attendance records for this month')}
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
