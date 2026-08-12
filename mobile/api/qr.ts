import axiosInstance from './axios'

export type QrAction = 'check_in' | 'check_out'

export interface ValidateQrResponse {
  valid: boolean
  action: QrAction
}

export async function validateQrToken(token: string) {
  return await axiosInstance.post<ValidateQrResponse>('/qr/validate/', { token })
}
