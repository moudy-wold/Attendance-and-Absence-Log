import axiosInstance from './axios'
import type { RawUser } from '../types/user'
import type { RawEmployeeAttendance } from '../types/attendance'

export interface RegisterPayload {
  username: string
  password: string
  first_name: string
  last_name: string
  phone: string
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
  is_regular?: boolean
  is_active?: boolean
  device_id?: string | null
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  return await axiosInstance.patch<RawUser>(`/auth/users/${id}/`, payload)
}

export async function listEmployees() {
  return await axiosInstance.get<RawUser[]>('/admin/employees/')
}

export async function getEmployee(id: number, year: number, month: number) {
  return await axiosInstance.get<RawEmployeeAttendance>(`/admin/employees/${id}/`, {
    params: { year, month },
  })
}

/** The export endpoint requires the auth header, so it can't be a plain <a href>. */
export async function exportAttendance(year: number, month: number) {
  return await axiosInstance.get<Blob>('/admin/attendance/export/', {
    params: { year, month },
    responseType: 'blob',
  })
}
