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
  const [workEndTime, setWorkEndTime] = useState<string>('')
  const [error, setError] = useState<string | undefined>()
  const [minSessionError, setMinSessionError] = useState<string | undefined>()
  const [workStartTimeError, setWorkStartTimeError] = useState<string | undefined>()
  const [workEndTimeError, setWorkEndTimeError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getSystemSettings()
      .then(({ data }) => {
        setQrLifetime(String(data.qr_token_lifetime_seconds))
        setMinSessionDuration(String(data.min_session_duration_seconds))
        setWorkStartTime(data.work_start_time.slice(0, 5))
        setWorkEndTime(data.work_end_time.slice(0, 5))
      })
      .catch((err) => toast.error(extractApiError(err, t('Something went wrong, please try again'))))
      .finally(() => setIsLoading(false))
  }, [t])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const qrValue = Number(qrLifetime)
    const minSessionValue = Number(minSessionDuration)

    const qrError =
      !Number.isInteger(qrValue) || qrValue < 5 || qrValue > 300 ? t('Must be between 5 and 300 seconds') : undefined
    const minSessionErrorMessage =
      !Number.isInteger(minSessionValue) || minSessionValue < 0 || minSessionValue > 3600
        ? t('Must be between 0 and 3600 seconds')
        : undefined
    const workStartTimeErrorMessage = !workStartTime ? t('Please set the work start time') : undefined
    const workEndTimeErrorMessage = !workEndTime ? t('Please set the work end time') : undefined

    setError(qrError)
    setMinSessionError(minSessionErrorMessage)
    setWorkStartTimeError(workStartTimeErrorMessage)
    setWorkEndTimeError(workEndTimeErrorMessage)

    if (qrError || minSessionErrorMessage || workStartTimeErrorMessage || workEndTimeErrorMessage) {
      toast.error(qrError ?? minSessionErrorMessage ?? workStartTimeErrorMessage ?? workEndTimeErrorMessage!)
      return
    }

    setIsSaving(true)
    try {
      await updateSystemSettings({
        qr_token_lifetime_seconds: qrValue,
        min_session_duration_seconds: minSessionValue,
        work_start_time: `${workStartTime}:00`,
        work_end_time: `${workEndTime}:00`,
      })
      toast.success(t('Settings saved'))
    } catch (err) {
      toast.error(extractApiError(err, t('Something went wrong, please try again')))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('Settings')} />

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
        {isLoading ? (
          <>
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
          </>
        ) : (
          <>
            <div>
              <TextField
                label={t('QR code lifetime (seconds)')}
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
              <p className="mt-1.5 text-xs text-neutral-500">{t('How often the attendance QR code on the kiosk screen refreshes. Between 5 and 300 seconds.')}</p>
            </div>

            <div>
              <TextField
                label={t('Minimum session duration (seconds)')}
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
              <p className="mt-1.5 text-xs text-neutral-500">{t('Minimum time that must pass between check-in and check-out for the same session. Prevents an accidental double-scan from recording an instant check-out.')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <TextField
                  label={t('Official work start time')}
                  type="time"
                  value={workStartTime}
                  onChange={(e) => {
                    setWorkStartTime(e.target.value)
                    setWorkStartTimeError(undefined)
                  }}
                  error={workStartTimeError}
                />
              </div>
              <div>
                <TextField
                  label={t('Official work end time')}
                  type="time"
                  value={workEndTime}
                  onChange={(e) => {
                    setWorkEndTime(e.target.value)
                    setWorkEndTimeError(undefined)
                  }}
                  error={workEndTimeError}
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-neutral-500">{t('Used to calculate late minutes in the attendance summary report.')}</p>
          </>
        )}

        <Button type="submit" loading={isSaving} disabled={isLoading} className="mt-2">
          {t('Save')}
        </Button>
      </form>
    </div>
  )
}
