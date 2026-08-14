import axiosInstance from './axios'

export interface DailyLateMinutes {
  date: string
  late_minutes: number
}

export interface EmployeeStats {
  year: number
  month: number
  working_days: number
  present_days: number
  absent_days: number
  late_minutes: number
  on_time_rate: number
  daily_late_minutes: DailyLateMinutes[]
}

export async function getMyStats() {
  return await axiosInstance.get<EmployeeStats>('/attendance/stats/')
}

export interface DailyAttendanceCount {
  date: string
  present_count: number
}

export interface TopEmployeeStat {
  id: number
  name: string
  value: number
}

export interface AdminStatsOverview {
  year: number
  month: number
  working_days: number
  total_employees: number
  regular_count: number
  irregular_count: number
  active_count: number
  suspended_count: number
  entry_account_count: number
  attendance_rate: number
  total_present_days: number
  total_absent_days: number
  total_late_minutes: number
  daily_trend: DailyAttendanceCount[]
  top_late: TopEmployeeStat[]
  top_absent: TopEmployeeStat[]
}

export async function getAdminStatsOverview(year: number, month: number) {
  return await axiosInstance.get<AdminStatsOverview>('/admin/stats/overview/', {
    params: { year, month },
  })
}
