import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { generateQrToken, type QrToken } from '../../../api/qr'
import { AdminHeader } from '../../Global/AdminHeader'
import { useAuth } from '../../../context/authContextValue'

const REFRESH_SAFETY_MARGIN_MS = 1500

export function KioskPageContent() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const [qrToken, setQrToken] = useState<QrToken | null>(null)
  const [hasError, setHasError] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    function scheduleNext(delayMs: number) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(fetchToken, delayMs)
    }

    function tickCountdown(expiresAt: string) {
      if (tickRef.current) clearInterval(tickRef.current)
      tickRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000))
        setSecondsLeft(remaining)
      }, 250)
    }

    async function fetchToken() {
      try {
        const { data } = await generateQrToken()
        if (cancelled) return
        setQrToken(data)
        setHasError(false)
        tickCountdown(data.expires_at)
        const delay = Math.max(1000, new Date(data.expires_at).getTime() - Date.now() - REFRESH_SAFETY_MARGIN_MS)
        scheduleNext(delay)
      } catch {
        if (cancelled) return
        setHasError(true)
        scheduleNext(3000)
      }
    }

    fetchToken()

    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader
        title={t('Attendance kiosk')}
        actions={
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            {t('Sign out')}
          </button>
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="flex aspect-square w-72 max-w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {qrToken ? (
            <QRCodeSVG value={qrToken.token} size={256} className="h-full w-full" />
          ) : (
            <span className="text-sm text-neutral-400">{hasError ? t('Could not generate a code, retrying…') : t('Generating…')}</span>
          )}
        </div>

        {qrToken && (
          <p className="text-sm text-neutral-500">
            {t('Refreshes in')} {secondsLeft}s
          </p>
        )}
      </div>
    </div>
  )
}
