import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import type { User } from '../types/user'

const BIOMETRIC_SESSION_KEY = 'biometric_session'

interface BiometricSession {
  access: string
  refresh: string
  user: User
}

export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])
  return hasHardware && isEnrolled
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage })
  return result.success
}

export async function saveBiometricSession(access: string, refresh: string, user: User): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, JSON.stringify({ access, refresh, user }))
}

export async function getBiometricSession(): Promise<BiometricSession | null> {
  const raw = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BiometricSession
  } catch {
    return null
  }
}
