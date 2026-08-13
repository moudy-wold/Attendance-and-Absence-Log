import axiosInstance from './axios'
import type { RawUser } from '../types/user'

export interface LoginPayload {
  username: string
  password: string
  deviceId?: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: RawUser
}

export async function login(payload: LoginPayload) {
  return await axiosInstance.post<LoginResponse>('/auth/login/', {
    username: payload.username,
    password: payload.password,
    device_id: payload.deviceId,
  })
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

export async function changePassword(payload: ChangePasswordPayload) {
  return await axiosInstance.post<{ detail: string }>('/auth/change-password/', payload)
}
