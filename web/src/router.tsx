import { createBrowserRouter } from 'react-router-dom'
import { LoginPageContent } from './components/Pages/Login/LoginPageContent'
import { DashboardPageContent } from './components/Pages/Dashboard/DashboardPageContent'
import { RequireAuth, RequireGuest } from './components/Global/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RequireGuest>
        <LoginPageContent />
      </RequireGuest>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <DashboardPageContent />
      </RequireAuth>
    ),
  },
])
