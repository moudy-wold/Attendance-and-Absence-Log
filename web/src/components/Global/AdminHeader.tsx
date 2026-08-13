import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../../context/authContextValue'

interface AdminHeaderProps {
  title: string
  onBack?: () => void
}

export function AdminHeader({ title, onBack }: AdminHeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4 rtl:-scale-x-100" aria-hidden="true">
              <path
                d="M12.5 15 7.5 10l5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-neutral-500 sm:inline">{user?.fullName}</span>
        {user?.isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label={t('settings.title')}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden="true">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.36 4.64l-1.42 1.42M6.06 13.94l-1.42 1.42M15.36 15.36l-1.42-1.42M6.06 6.06 4.64 4.64"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        <LanguageSwitcher />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}
