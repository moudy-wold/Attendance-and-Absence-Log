import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPageContent } from './components/Pages/Login/LoginPageContent'
import { EmployeesPageContent } from './components/Pages/Employees/EmployeesPageContent'
import { CreateEmployeePageContent } from './components/Pages/Employees/CreateEmployeePageContent'
import { EmployeeDetailPageContent } from './components/Pages/Employees/EmployeeDetailPageContent'
import { KioskPageContent } from './components/Pages/Kiosk/KioskPageContent'
import { RequireAuth, RequireGuest } from './components/Global/RequireAuth'
import { useAuth } from './context/authContextValue'

function Home() {
  const { user } = useAuth()
  if (user?.isEntry) return <Navigate to="/kiosk" replace />
  return <EmployeesPageContent />
}

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
        <Home />
      </RequireAuth>
    ),
  },
  {
    path: '/employees/new',
    element: (
      <RequireAuth>
        <CreateEmployeePageContent />
      </RequireAuth>
    ),
  },
  {
    path: '/employees/:id',
    element: (
      <RequireAuth>
        <EmployeeDetailPageContent />
      </RequireAuth>
    ),
  },
  {
    path: '/kiosk',
    element: (
      <RequireAuth>
        <KioskPageContent />
      </RequireAuth>
    ),
  },
])
