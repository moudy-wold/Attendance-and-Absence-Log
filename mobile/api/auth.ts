import axiosInstance from './axios'
import type { RawUser } from '../types/user'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: RawUser
}

export async function login(payload: LoginPayload) {
  return await axiosInstance.post<LoginResponse>('/auth/login/', payload)
}
