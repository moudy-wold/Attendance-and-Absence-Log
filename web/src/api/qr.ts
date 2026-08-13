import axiosInstance from './axios'

export interface QrToken {
  token: string
  created_at: string
  expires_at: string
  is_active: boolean
}

export async function generateQrToken() {
  return await axiosInstance.post<QrToken>('/qr/generate/')
}
