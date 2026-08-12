import { useTranslation } from 'react-i18next'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'

export function DashboardPageContent() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-full flex-col gap-6 bg-neutral-50 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">{user?.fullName}</h1>
        <LanguageSwitcher />
      </div>
      <p className="text-sm text-neutral-500">
        {user?.isAdmin ? 'Admin' : 'Employee'} · {user?.phone}
      </p>
      <Button className="w-fit px-4" onClick={logout}>
        {t('auth.logout')}
      </Button>
    </div>
  )
}
