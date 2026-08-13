import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import { ForcedChangePasswordModal } from './ForcedChangePasswordModal'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <>
      {children}
      {user?.isFirstLogin && <ForcedChangePasswordModal />}
    </>
  )
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}
