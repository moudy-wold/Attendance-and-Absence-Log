import { createContext, useContext } from 'react'
import type { LoginPayload } from '../api/auth'
import type { User } from '../types/user'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
