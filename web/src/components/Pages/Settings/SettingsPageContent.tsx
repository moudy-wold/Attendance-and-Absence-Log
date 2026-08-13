import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getSystemSettings, updateSystemSettings } from '../../../api/admin'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { TextField } from '../../Global/TextField'
import { Button } from '../../Global/Button'

export function SettingsPageContent() {
  const { t } = useTranslation()

  const [qrLifetime, setQrLifetime] = useState<string>('')
  const [minSessionDuration, setMinSessionDuration] = useState<string>('')
  const [workStartTime, setWorkStartTime] = useState<string>('')
  const [error, setError] = useState<string | undefined>()
  const [minSessionError, setMinSessionError] = useState<string | undefined>()
  const [workStartTimeError, setWorkStartTimeError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getSystemSettings()
      .then(({ data }) => {
        setQrLifetime(String(data.qr_token_lifetime_seconds))
        setMinSessionDuration(String(data.min_session_duration_seconds))
        setWorkStartTime(data.work_start_time.slice(0, 5))
      })
      .catch((err) => toast.error(extractApiError(err, t('common.unexpectedError'))))
      .finally(() => setIsLoading(false))
  }, [t])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const qrValue = Number(qrLifetime)
    const minSessionValue = Number(minSessionDuration)

    const qrError =
      !Number.isInteger(qrValue) || qrValue < 5 || qrValue > 300 ? t('settings.qrLifetimeRange') : undefined
    const minSessionErrorMessage =
      !Number.isInteger(minSessionValue) || minSessionValue < 0 || minSessionValue > 3600
        ? t('settings.minSessionDurationRange')
        : undefined
    const workStartTimeErrorMessage = !workStartTime ? t('settings.workStartTimeRequired') : undefined

    setError(qrError)
    setMinSessionError(minSessionErrorMessage)
    setWorkStartTimeError(workStartTimeErrorMessage)

    if (qrError || minSessionErrorMessage || workStartTimeErrorMessage) {
      toast.error(qrError ?? minSessionErrorMessage ?? workStartTimeErrorMessage!)
      return
    }

    setIsSaving(true)
    try {
      await updateSystemSettings({
        qr_token_lifetime_seconds: qrValue,
        min_session_duration_seconds: minSessionValue,
        work_start_time: `${workStartTime}:00`,
      })
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(extractApiError(err, t('common.unexpectedError')))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('settings.title')} />

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
        {isLoading ? (
          <>
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
          </>
        ) : (
          <>
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

            <div>
              <TextField
                label={t('settings.minSessionDurationLabel')}
                type="number"
                min={0}
                max={3600}
                value={minSessionDuration}
                onChange={(e) => {
                  setMinSessionDuration(e.target.value)
                  setMinSessionError(undefined)
                }}
                error={minSessionError}
              />
              <p className="mt-1.5 text-xs text-neutral-500">{t('settings.minSessionDurationHint')}</p>
            </div>

            <div>
              <TextField
                label={t('settings.workStartTimeLabel')}
                type="time"
                value={workStartTime}
                onChange={(e) => {
                  setWorkStartTime(e.target.value)
                  setWorkStartTimeError(undefined)
                }}
                error={workStartTimeError}
              />
              <p className="mt-1.5 text-xs text-neutral-500">{t('settings.workStartTimeHint')}</p>
            </div>
          </>
        )}

        <Button type="submit" loading={isSaving} disabled={isLoading} className="mt-2">
          {t('common.save')}
        </Button>
      </form>
    </div>
  )
}
