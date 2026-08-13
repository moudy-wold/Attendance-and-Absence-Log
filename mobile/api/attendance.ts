import axiosInstance from './axios'

export interface RawAttendance {
  id: number
  date: string
  check_in: string
  check_out: string | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function recordAttendance(token: string) {
  return await axiosInstance.post<RawAttendance>('/attendance/record/', { token })
}

export async function getMyAttendance(page = 1) {
  return await axiosInstance.get<Paginated<RawAttendance>>('/attendance/my/', { params: { page } })
}
