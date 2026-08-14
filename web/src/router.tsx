import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPageContent } from './components/Pages/Login/LoginPageContent'
import { EmployeesPageContent } from './components/Pages/Employees/EmployeesPageContent'
import { CreateEmployeePageContent } from './components/Pages/Employees/CreateEmployeePageContent'
import { EmployeeDetailPageContent } from './components/Pages/Employees/EmployeeDetailPageContent'
import { EmployeeStatsPageContent } from './components/Pages/Employees/EmployeeStatsPageContent'
import { KioskPageContent } from './components/Pages/Kiosk/KioskPageContent'
import { EntryAccountsPageContent } from './components/Pages/EntryAccounts/EntryAccountsPageContent'
import { EntryAccountDetailPageContent } from './components/Pages/EntryAccounts/EntryAccountDetailPageContent'
import { AdminStatsPageContent } from './components/Pages/Stats/AdminStatsPageContent'
import { SettingsPageContent } from './components/Pages/Settings/SettingsPageContent'
import { RequireAuth, RequireGuest } from './components/Global/RequireAuth'
import { AdminLayout } from './components/Global/AdminLayout'
import { useAuth } from './context/authContextValue'

function AdminArea() {
  const { user } = useAuth()
  if (user?.isEntry) return <Navigate to="/kiosk" replace />
  return <AdminLayout />
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
    path: '/kiosk',
    element: (
      <RequireAuth>
        <KioskPageContent />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AdminArea />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminStatsPageContent /> },
      { path: 'employees', element: <EmployeesPageContent /> },
      { path: 'employees/new', element: <CreateEmployeePageContent /> },
      { path: 'employees/:id', element: <EmployeeDetailPageContent /> },
      { path: 'employees/:id/stats', element: <EmployeeStatsPageContent /> },
      { path: 'entry-accounts', element: <EntryAccountsPageContent /> },
      { path: 'entry-accounts/:id', element: <EntryAccountDetailPageContent /> },
      { path: 'settings', element: <SettingsPageContent /> },
    ],
  },
])
