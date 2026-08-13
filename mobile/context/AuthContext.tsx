import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, type LoginPayload } from '../api/auth'
import { tokenService } from '../api/tokenService'
import { setUnauthorizedHandler } from '../api/authBridge'
import { mapUser, type User } from '../types/user'
import { getDeviceId } from '../lib/deviceId'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    tokenService.getUser().then((storedUser) => {
      setUser(storedUser)
      setIsBootstrapping(false)
    })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      async login(payload: LoginPayload) {
        const deviceId = await getDeviceId()
        const { data } = await loginRequest({ ...payload, deviceId })
        const mappedUser = mapUser(data.user)

        // Tokens are stored either way so a first-login user's change-password
        // call is authorized, but the session itself isn't committed (no user
        // state, no isAuthenticated) until they've changed their password and
        // logged in again with it.
        await tokenService.setTokens(data.access, data.refresh)
        if (mappedUser.isFirstLogin) return mappedUser

        await tokenService.setUser(mappedUser)
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
          tokenService.setUser(next)
          return next
        })
      },
    }),
    [user, isBootstrapping],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
