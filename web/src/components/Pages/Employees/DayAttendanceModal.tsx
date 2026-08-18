import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Attendance } from '../../../types/attendance'

interface DayAttendanceModalProps {
  date: string
  sessions: Attendance[]
  onClose: () => void
}

function formatTime(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function DayAttendanceModal({ date, sessions, onClose }: DayAttendanceModalProps) {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const orderedSessions = [...sessions].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-neutral-900">
          {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(date))}
        </h2>

        <div className="mt-4 flex flex-col gap-2.5">
          {orderedSessions.map((session, index) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2.5 text-sm"
            >
              <span className="text-xs font-medium text-neutral-400">#{index + 1}</span>
              <span className="flex items-center gap-1.5 text-neutral-700">
                <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                {formatTime(session.checkIn, i18n.language)}
              </span>
              <span className="flex items-center gap-1.5 text-neutral-700">
                <span className="size-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                {formatTime(session.checkOut, i18n.language)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {t('Close')}
        </button>
      </div>
    </div>
  )
}
