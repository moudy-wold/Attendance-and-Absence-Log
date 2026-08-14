import { useTranslation } from 'react-i18next'

interface AdminHeaderProps {
  title: string
  onBack?: () => void
}

export function AdminHeader({ title, onBack }: AdminHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-6 py-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('Back')}
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
  )
}
