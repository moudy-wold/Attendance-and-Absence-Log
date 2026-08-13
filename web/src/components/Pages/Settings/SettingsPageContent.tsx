import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSystemSettings, updateSystemSettings } from '../../../api/admin'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { TextField } from '../../Global/TextField'
import { Button } from '../../Global/Button'

export function SettingsPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [qrLifetime, setQrLifetime] = useState<string>('')
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getSystemSettings()
      .then(({ data }) => setQrLifetime(String(data.qr_token_lifetime_seconds)))
      .catch((err) => toast.error(extractApiError(err, t('common.unexpectedError'))))
      .finally(() => setIsLoading(false))
  }, [t])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const value = Number(qrLifetime)
    if (!Number.isInteger(value) || value < 5 || value > 300) {
      setError(t('settings.qrLifetimeRange'))
      toast.error(t('settings.qrLifetimeRange'))
      return
    }
    setError(undefined)

    setIsSaving(true)
    try {
      await updateSystemSettings({ qr_token_lifetime_seconds: value })
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(extractApiError(err, t('common.unexpectedError')))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('settings.title')} onBack={() => navigate('/')} />

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
        {isLoading ? (
          <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
        ) : (
          <div>
            <TextField
              label={t('settings.qrLifetimeLabel')}
              type="number"
              min={5}
              max={300}
              value={qrLifetime}
              onChange={(e) => {
                setQrLifetime(e.target.value)
                setError(undefined)
              }}
              error={error}
            />
            <p className="mt-1.5 text-xs text-neutral-500">{t('settings.qrLifetimeHint')}</p>
          </div>
        )}

        <Button type="submit" loading={isSaving} disabled={isLoading} className="mt-2">
          {t('common.save')}
        </Button>
      </form>
    </div>
  )
}
