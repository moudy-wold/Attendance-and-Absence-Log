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
