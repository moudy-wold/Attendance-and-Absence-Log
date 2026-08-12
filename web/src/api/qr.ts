import axiosInstance from './axios'

export type QrAction = 'check_in' | 'check_out'

export interface QrToken {
  token: string
  action: QrAction
  created_at: string
  expires_at: string
  is_active: boolean
}

export async function generateQrToken(action: QrAction) {
  return await axiosInstance.post<QrToken>('/qr/generate/', { action })
}
