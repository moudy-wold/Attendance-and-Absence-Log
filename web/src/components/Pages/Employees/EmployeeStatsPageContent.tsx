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
import { DayAttendanceModal } from './DayAttendanceModal'

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

interface DayAttendance {
  date: string
  firstCheckIn: string
  lastCheckOut: string | null
  checkInCount: number
  checkOutCount: number
  sessions: Attendance[]
}

function groupAttendanceByDay(records: Attendance[]): DayAttendance[] {
  const byDay = new Map<string, Attendance[]>()
  for (const record of records) {
    const sessions = byDay.get(record.date)
    if (sessions) sessions.push(record)
    else byDay.set(record.date, [record])
  }

  return Array.from(byDay.entries())
    .map(([date, sessions]) => {
      const checkOuts = sessions.filter((s) => s.checkOut !== null)
      return {
        date,
        firstCheckIn: sessions.reduce((min, s) => (s.checkIn < min ? s.checkIn : min), sessions[0].checkIn),
        lastCheckOut:
          checkOuts.length === 0
            ? null
            : checkOuts.reduce((max, s) => (s.checkOut! > max ? s.checkOut! : max), checkOuts[0].checkOut!),
        checkInCount: sessions.length,
        checkOutCount: checkOuts.length,
        sessions,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
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

  // نطاق تاريخ وحيد يحدد كلًا من البيانات المعروضة في الجدول والتصدير إلى إكسل.
  const [startDate, setStartDate] = useState(toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [endDate, setEndDate] = useState(toIsoDate(now))

  const [employee, setEmployee] = useState<User | null>(null)
  const [attendance, setAttendance] = useState<Attendance[] | null>(null)
  const [stats, setStats] = useState<MonthStats | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [openDay, setOpenDay] = useState<DayAttendance | null>(null)

  const load = useCallback(() => {
    setAttendance(null)
    setStats(null)
    getEmployee(employeeId, startDate, endDate)
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
  }, [employeeId, startDate, endDate, t])

  useEffect(() => {
    load()
  }, [load])

  async function handleExport() {
    if (startDate > endDate) {
      toast.error(t('Start date must be before or equal to the end date'))
      return
    }

    setIsExporting(true)
    try {
      const { data } = await exportEmployeeAttendance(employeeId, startDate, endDate)
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${employee?.username ?? employeeId}-${startDate}_${endDate}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(extractApiError(error, t('Something went wrong, please try again')))
    } finally {
      setIsExporting(false)
    }
  }

  const days = attendance ? groupAttendanceByDay(attendance) : null

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
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-36">
                <TextField
                  label={t('From')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-36">
                <TextField
                  label={t('To')}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                    <th className="px-3 py-2.5 text-start font-medium">{t('Sessions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {days === null &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-50 last:border-0">
                        <td className="px-3 py-3" colSpan={4}>
                          <div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
                        </td>
                      </tr>
                    ))}

                  {days !== null && days.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-sm text-neutral-400" colSpan={4}>
                        {t('No attendance records for this period')}
                      </td>
                    </tr>
                  )}

                  {days?.map((day) => (
                    <tr key={day.date} className="border-b border-neutral-50 last:border-0">
                      <td className="px-3 py-2.5 text-neutral-700">{formatDate(day.date, i18n.language)}</td>
                      <td className="px-3 py-2.5 text-neutral-700">{formatTime(day.firstCheckIn, i18n.language)}</td>
                      <td className="px-3 py-2.5 text-neutral-700">{formatTime(day.lastCheckOut, i18n.language)}</td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setOpenDay(day)}
                          className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-100"
                        >
                          <span className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                            <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                            {day.checkInCount}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                            <span className="size-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                            {day.checkOutCount}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {openDay && (
        <DayAttendanceModal date={openDay.date} sessions={openDay.sessions} onClose={() => setOpenDay(null)} />
      )}
    </div>
  )
}
