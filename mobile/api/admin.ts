import axiosInstance from './axios'
import type { RawUser } from '../types/user'
import type { RawAttendance, Paginated } from './attendance'

export interface RawEmployeeAttendance extends RawUser {
  attendance: RawAttendance[]
}

export interface ListUsersParams {
  page?: number
  search?: string
  is_regular?: boolean
  is_active?: boolean
}

export async function listEmployees(params: ListUsersParams = {}) {
  return await axiosInstance.get<Paginated<RawUser>>('/admin/employees/', { params })
}

export async function listEntryUsers(params: ListUsersParams = {}) {
  return await axiosInstance.get<Paginated<RawUser>>('/admin/entry-users/', { params })
}

export async function getEmployee(id: number, year: number, month: number) {
  return await axiosInstance.get<RawEmployeeAttendance>(`/admin/employees/${id}/`, {
    params: { year, month },
  })
}

export async function getUser(id: number) {
  return await axiosInstance.get<RawUser>(`/auth/users/${id}/`)
}

export interface SystemSettings {
  qr_token_lifetime_seconds: number
  min_session_duration_seconds: number
  work_start_time: string
  work_end_time: string
}

export async function getSystemSettings() {
  return await axiosInstance.get<SystemSettings>('/admin/settings/')
}
