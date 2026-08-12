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
        await tokenService.setTokens(data.access, data.refresh)
        const mappedUser = mapUser(data.user)
        await tokenService.setUser(mappedUser)
        setUser(mappedUser)
        return mappedUser
      },
      logout() {
        tokenService.clear()
        setUser(null)
      },
    }),
    [user, isBootstrapping],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
