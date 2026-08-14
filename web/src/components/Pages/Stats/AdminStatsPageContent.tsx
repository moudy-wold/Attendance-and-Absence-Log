import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminStatsOverview, type AdminStatsOverview } from '../../../api/stats'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'

const BLUE = '#2a78d6'
const ORANGE = '#eb6834'
const AQUA = '#1baf7a'
const GRID_COLOR = '#e1e0d9'
const AXIS_COLOR = '#898781'

function monthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, 1),
  )
}

function dayOfMonth(iso: string) {
  return Number(iso.slice(-2))
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-4">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span className="text-2xl font-semibold text-neutral-900">{value}</span>
      {sub && <span className="text-xs text-neutral-500">{sub}</span>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      {children}
    </div>
  )
}

function EmptyChartState({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-neutral-400">{label}</p>
}

export function AdminStatsPageContent() {
  const { t, i18n } = useTranslation()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [stats, setStats] = useState<AdminStatsOverview | null>(null)

  useEffect(() => {
    let cancelled = false
    setStats(null)

    getAdminStatsOverview(year, month)
      .then(({ data }) => {
        if (!cancelled) setStats(data)
      })
      .catch((error) => {
        if (!cancelled) toast.error(extractApiError(error, t('Something went wrong, please try again')))
      })

    return () => {
      cancelled = true
    }
  }, [year, month, t])

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  const trendData = stats?.daily_trend.map((point) => ({ ...point, day: dayOfMonth(point.date) })) ?? []
  const topLate = stats?.top_late.filter((item) => item.value > 0) ?? []
  const topAbsent = stats?.top_absent.filter((item) => item.value > 0) ?? []
  const topEarlyLeave = stats?.top_early_leave.filter((item) => item.value > 0) ?? []

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('Statistics')} />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6">
        <div className="flex items-center justify-center gap-2">
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
          <span className="w-36 text-center text-sm font-medium text-neutral-800">
            {monthLabel(year, month, i18n.language)}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label={t('Back')}
            className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-3.5 -scale-x-100 rtl:scale-x-100" aria-hidden="true">
              <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {!stats ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label={t('Attendance rate')} value={`${stats.attendance_rate}%`} />
              <StatCard label={t('Total employees')} value={stats.total_employees} />
              <StatCard label={t('Late minutes (total)')} value={stats.total_late_minutes} />
              <StatCard label={t('Absent days (total)')} value={stats.total_absent_days} />
              <StatCard label={t('Early leave minutes (total)')} value={stats.total_early_leave_minutes} />
              <StatCard
                label={t('Regular employees')}
                value={stats.regular_count}
                sub={t('{{irregular}} irregular', { irregular: stats.irregular_count })}
              />
              <StatCard
                label={t('Active employees')}
                value={stats.active_count}
                sub={t('{{count}} suspended', { count: stats.suspended_count })}
              />
              <StatCard label={t('Kiosk accounts')} value={stats.entry_account_count} />
              <StatCard label={t('Working days this month')} value={stats.working_days} />
            </div>

            <ChartCard title={t('Daily attendance trend')}>
              {trendData.length === 0 ? (
                <EmptyChartState label={t('No data for this month yet')} />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: AXIS_COLOR }}
                      axisLine={{ stroke: GRID_COLOR }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: AXIS_COLOR }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      formatter={(value) => [value, t('Present')]}
                      labelFormatter={(day) => `${t('Date')} ${day}`}
                      contentStyle={{ borderRadius: 8, borderColor: '#e5e5e5', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="present_count" stroke={BLUE} strokeWidth={2} fill={BLUE} fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <ChartCard title={t('Most late employees')}>
                {topLate.length === 0 ? (
                  <EmptyChartState label={t('No data for this month yet')} />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(140, topLate.length * 44)}>
                    <BarChart data={topLate} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 12, fill: '#52514e' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, t('minutes late')]}
                        contentStyle={{ borderRadius: 8, borderColor: '#e5e5e5', fontSize: 12 }}
                      />
                      <Bar dataKey="value" fill={BLUE} radius={4} barSize={18}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#52514e' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title={t('Most absent employees')}>
                {topAbsent.length === 0 ? (
                  <EmptyChartState label={t('No data for this month yet')} />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(140, topAbsent.length * 44)}>
                    <BarChart data={topAbsent} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 12, fill: '#52514e' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, t('days absent')]}
                        contentStyle={{ borderRadius: 8, borderColor: '#e5e5e5', fontSize: 12 }}
                      />
                      <Bar dataKey="value" fill={ORANGE} radius={4} barSize={18}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#52514e' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title={t('Most early leavers')}>
                {topEarlyLeave.length === 0 ? (
                  <EmptyChartState label={t('No data for this month yet')} />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(140, topEarlyLeave.length * 44)}>
                    <BarChart
                      data={topEarlyLeave}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 12, fill: '#52514e' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, t('minutes early')]}
                        contentStyle={{ borderRadius: 8, borderColor: '#e5e5e5', fontSize: 12 }}
                      />
                      <Bar dataKey="value" fill={AQUA} radius={4} barSize={18}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#52514e' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
