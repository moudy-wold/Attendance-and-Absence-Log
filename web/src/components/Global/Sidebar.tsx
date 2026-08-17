import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../../context/authContextValue'

function StatsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden="true">
      <path d="M3.5 16.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 16.5v-5M10 16.5v-8M14 16.5v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function EmployeesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden="true">
      <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.75 16c0-2.9 2.13-4.75 4.75-4.75s4.75 1.85 4.75 4.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13.5 4.25c1.4.35 2.4 1.6 2.4 3.1 0 1.5-1 2.75-2.4 3.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14.75 11.5c1.9.5 3.25 1.95 3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function EntryAccountsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden="true">
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 17h6M10 13.5V17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.36 4.64l-1.42 1.42M6.06 13.94l-1.42 1.42M15.36 15.36l-1.42-1.42M6.06 6.06 4.64 4.64"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4.5 rtl:-scale-x-100" aria-hidden="true">
      <path
        d="M7.5 17.5h-3a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 4.5 2.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 14.25 17.25 10 13 5.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M12.5 15 7.5 10l5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const navItems = [
  { to: '/', end: true, labelKey: 'Statistics', Icon: StatsIcon },
  { to: '/employees', end: false, labelKey: 'Employees', Icon: EmployeesIcon },
  { to: '/entry-accounts', end: false, labelKey: 'Kiosk accounts', Icon: EntryAccountsIcon },
  { to: '/settings', end: false, labelKey: 'Settings', Icon: SettingsIcon },
] as const

const COLLAPSED_STORAGE_KEY = 'sidebar:collapsed'

export function Sidebar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function toggleCollapsed() {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isCollapsed ? 'md:justify-center md:gap-0 md:px-0' : ''
    } ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`

  return (
    <div className=''>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={t('Toggle menu')}
          className="flex size-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-neutral-900">{t('Admin panel')}</span>
        <div className="size-9" />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex h-screen w-64 shrink-0 flex-col border-e border-neutral-200 bg-white transition-[width,transform] duration-300 ease-in-out md:static ${isOpen ? '' : 'max-md:-translate-x-full max-md:rtl:translate-x-full'
          } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className={`hidden items-center md:flex ${isCollapsed ? 'justify-center px-2 py-5' : 'justify-between px-5 py-5'}`}>
          {!isCollapsed && (
            <span className="truncate text-base font-semibold text-neutral-900">{t('Admin panel')}</span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? t('Expand sidebar') : t('Collapse sidebar')}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <span
              className={`block transition-transform duration-300 rtl:-scale-x-100 ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <CollapseIcon />
            </span>
          </button>
        </div>
        <div className="h-14 md:hidden" />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {navItems.map(({ to, end, labelKey, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
              title={isCollapsed ? t(labelKey) : undefined}
            >
              <span className="shrink-0">
                <Icon />
              </span>
              <span className={`truncate ${isCollapsed ? 'md:hidden' : ''}`}>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className={`flex flex-col gap-3 border-t border-neutral-200 p-4 ${isCollapsed ? 'md:items-center' : ''}`}
        >
          <span className={`truncate text-sm font-medium text-neutral-700 ${isCollapsed ? 'md:hidden' : ''}`}>
            {user?.fullName}
          </span>
          <div className={isCollapsed ? 'md:hidden' : ''}>
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? t('Sign out') : undefined}
            className={`rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 ${isCollapsed ? 'md:flex md:size-9 md:items-center md:justify-center md:px-0 md:py-0' : 'px-3 py-1.5'
              }`}
          >
            {isCollapsed ? (
              <span className="hidden md:block">
                <LogoutIcon />
              </span>
            ) : null}
            <span className={isCollapsed ? 'md:hidden' : ''}>{t('Sign out')}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
