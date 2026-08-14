import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, type LoginPayload } from '../api/auth'
import { tokenService, USER_STORAGE_KEY } from '../api/tokenService'
import { setUnauthorizedHandler } from '../api/authBridge'
import { mapUser, type User } from '../types/user'
import { getDeviceId } from '../lib/deviceId'
import { AuthContext, type AuthContextValue } from './authContextValue'

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

  useEffect(() => {
    // A 401/403 from the API layer clears tokens and calls this — RequireAuth
    // then redirects to /login on its own, no page reload needed.
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      async login(payload: LoginPayload) {
        const { data } = await loginRequest({ ...payload, deviceId: getDeviceId() })
        const mappedUser = mapUser(data.user)

        // Tokens are stored either way so a first-login user's change-password
        // call is authorized, but the session itself isn't committed (no user
        // state, no isAuthenticated) until they've changed their password and
        // logged in again with it.
        tokenService.setTokens(data.access, data.refresh)
        if (mappedUser.isFirstLogin) return mappedUser

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser))
        setUser(mappedUser)
        return mappedUser
      },
      logout() {
        tokenService.clear()
        setUser(null)
      },
      updateUser(patch: Partial<User>) {
        setUser((prev) => {
          if (!prev) return prev
          const next = { ...prev, ...patch }
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next))
          return next
        })
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
