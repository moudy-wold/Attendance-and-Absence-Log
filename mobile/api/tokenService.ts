import * as SecureStore from 'expo-secure-store'
import type { User } from '../types/user'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'auth_user'

export const tokenService = {
  async getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  },

  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  },

  async setTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access)
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh)
  },

  async getUser(): Promise<User | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },

  async setUser(user: User) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
  },

  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
  },
}
