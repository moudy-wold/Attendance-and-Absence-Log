import { useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, type LoginPayload } from '../api/auth'
import { tokenService } from '../api/tokenService'
import { mapUser, type User } from '../types/user'
import { AuthContext, type AuthContextValue } from './authContextValue'

const USER_STORAGE_KEY = 'auth_user'

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      async login(payload: LoginPayload) {
        const { data } = await loginRequest(payload)
        tokenService.setTokens(data.access, data.refresh)
        const mappedUser = mapUser(data.user)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)
        return mappedUser
      },
      logout() {
        tokenService.clear()
        localStorage.removeItem(USER_STORAGE_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
