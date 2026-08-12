import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}
