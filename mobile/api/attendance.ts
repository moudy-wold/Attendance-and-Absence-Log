import axiosInstance from './axios'

export interface RawAttendance {
  id: number
  date: string
  check_in: string
  check_out: string | null
}

export async function recordAttendance(token: string) {
  return await axiosInstance.post<RawAttendance>('/attendance/record/', { token })
}

export async function getMyAttendance() {
  return await axiosInstance.get<RawAttendance[]>('/attendance/my/')
}
