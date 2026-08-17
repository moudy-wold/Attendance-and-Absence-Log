import axiosInstance from './axios'
import type { RawUser } from '../types/user'
import type { RawEmployeeAttendance } from '../types/attendance'

export interface RegisterPayload {
  /** Omit entirely (don't send an empty string) to default the password to the phone number. */
  password?: string
  first_name: string
  last_name: string
  phone: string
  type?: number | null
  is_employee: boolean
  is_entry: boolean
  is_regular: boolean
}

export async function registerUser(payload: RegisterPayload) {
  return await axiosInstance.post<RawUser>('/auth/register/', payload)
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  type?: number | null
  is_regular?: boolean
  is_active?: boolean
  device_id?: string | null
  /** Admin-only: sets the account's password directly, no old password required. */
  password?: string
}

export async function getUser(id: number) {
  return await axiosInstance.get<RawUser>(`/auth/users/${id}/`)
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  return await axiosInstance.patch<RawUser>(`/auth/users/${id}/`, payload)
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ListEmployeesParams {
  page?: number
  search?: string
  is_regular?: boolean
  is_active?: boolean
}

export async function listEmployees(params: ListEmployeesParams = {}) {
  return await axiosInstance.get<Paginated<RawUser>>('/admin/employees/', { params })
}

export async function listEntryUsers(params: ListEmployeesParams = {}) {
  return await axiosInstance.get<Paginated<RawUser>>('/admin/entry-users/', { params })
}

export async function getEmployee(id: number, year: number, month: number) {
  return await axiosInstance.get<RawEmployeeAttendance>(`/admin/employees/${id}/`, {
    params: { year, month },
  })
}

/** The export endpoint requires the auth header, so it can't be a plain <a href>.
 *  startDate/endDate are 'YYYY-MM-DD' strings (inclusive on both ends). */
export async function exportEmployeeAttendance(id: number, startDate: string, endDate: string) {
  return await axiosInstance.get<Blob>(`/admin/employees/${id}/export/`, {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  })
}

export interface ExportAttendanceSummaryParams extends ListEmployeesParams {
  lang: string
  start_date?: string
  end_date?: string
}

/** Exports the same filtered/searched results currently shown on the employees list, with column
 *  headers translated to match the site's current language. */
export async function exportAttendanceSummary(params: ExportAttendanceSummaryParams) {
  return await axiosInstance.get<Blob>('/admin/attendance/summary-export/', {
    params,
    responseType: 'blob',
  })
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

export async function updateSystemSettings(payload: Partial<SystemSettings>) {
  return await axiosInstance.patch<SystemSettings>('/admin/settings/', payload)
}
