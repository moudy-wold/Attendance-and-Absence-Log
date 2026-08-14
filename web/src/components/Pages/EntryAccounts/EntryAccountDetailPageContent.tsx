import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getUser, updateUser } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Switch } from '../../Global/Switch'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { Button } from '../../Global/Button'

interface InfoForm {
  firstName: string
  lastName: string
  phone: string
  email: string
}

interface PasswordForm {
  newPassword: string
}

const initialPasswordForm: PasswordForm = { newPassword: '' }

export function EntryAccountDetailPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const accountId = Number(id)

  const [account, setAccount] = useState<User | null>(null)
  const [infoForm, setInfoForm] = useState<InfoForm | null>(null)
  const [isSavingInfo, setIsSavingInfo] = useState(false)

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const load = useCallback(() => {
    getUser(accountId)
      .then(({ data }) => {
        const mapped = mapUser(data)
        setAccount(mapped)
        setInfoForm({
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          phone: mapped.phone,
          email: mapped.email ?? '',
        })
      })
      .catch((error) => toast.error(extractApiError(error, t('common.unexpectedError'))))
  }, [accountId, t])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdate(payload: Parameters<typeof updateUser>[1]) {
    if (!account) return
    try {
      const { data } = await updateUser(account.id, payload)
      setAccount(mapUser(data))
      toast.success(t('employeeDetail.updateSuccess'))
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    }
  }

  async function handleResetDevice() {
    if (!window.confirm(t('employeeDetail.resetDeviceConfirm'))) return
    await handleUpdate({ device_id: null })
    toast.success(t('employeeDetail.resetDeviceSuccess'))
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault()
    if (!infoForm) return

    setIsSavingInfo(true)
    try {
      const { data } = await updateUser(accountId, {
        first_name: infoForm.firstName.trim(),
        last_name: infoForm.lastName.trim(),
        phone: infoForm.phone.trim(),
        email: infoForm.email.trim() || undefined,
      })
      setAccount(mapUser(data))
      toast.success(t('employeeDetail.updateSuccess'))
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setIsSavingInfo(false)
    }
  }

  function validatePassword(): Partial<Record<keyof PasswordForm, string>> {
    const next: Partial<Record<keyof PasswordForm, string>> = {}
    if (passwordForm.newPassword.length < 8) next.newPassword = t('changePassword.tooShort')
    else if (/^\d+$/.test(passwordForm.newPassword)) next.newPassword = t('changePassword.numericOnly')
    return next
  }

  async function handleSavePassword(e: FormEvent) {
    e.preventDefault()

    const validationErrors = validatePassword()
    setPasswordErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSavingPassword(true)
    try {
      await updateUser(accountId, { password: passwordForm.newPassword })
      toast.success(t('entryAccountDetail.passwordUpdated'))
      setPasswordForm(initialPasswordForm)
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={account?.fullName ?? '…'} onBack={() => navigate('/entry-accounts')} />

      {!account || !infoForm ? (
        <div className="p-6">
          <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-500">{account.username}</p>

            <Switch
              label={t('employeeDetail.activeToggleLabel')}
              description={t('employeeDetail.activeToggleDescription')}
              checked={account.isActive}
              onChange={(checked) => handleUpdate({ is_active: checked })}
            />

            <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-neutral-800">{t('employeeDetail.deviceSection')}</span>
                <span className="text-xs text-neutral-500">
                  {account.deviceId ? t('employeeDetail.deviceBound') : t('employeeDetail.deviceNotBound')}
                </span>
              </span>
              {account.deviceId && (
                <button
                  type="button"
                  onClick={handleResetDevice}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  {t('employeeDetail.resetDevice')}
                </button>
              )}
            </div>
          </section>

          <form
            onSubmit={handleSaveInfo}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-800">{t('entryAccountDetail.infoSectionTitle')}</h2>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label={t('employees.form.firstName')}
                value={infoForm.firstName}
                onChange={(e) => setInfoForm({ ...infoForm, firstName: e.target.value })}
              />
              <TextField
                label={t('employees.form.lastName')}
                value={infoForm.lastName}
                onChange={(e) => setInfoForm({ ...infoForm, lastName: e.target.value })}
              />
            </div>

            <TextField
              label={t('employees.form.phone')}
              value={infoForm.phone}
              onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
              type="tel"
            />

            <TextField
              label={t('entryAccountDetail.email')}
              value={infoForm.email}
              onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
              type="email"
            />

            <Button type="submit" loading={isSavingInfo} className="mt-1 w-fit px-5">
              {t('common.save')}
            </Button>
          </form>

          <form
            onSubmit={handleSavePassword}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-800">{t('entryAccountDetail.passwordSectionTitle')}</h2>

            <PasswordField
              label={t('entryAccountDetail.newPassword')}
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                setPasswordErrors({ ...passwordErrors, newPassword: undefined })
              }}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
            />

            <Button type="submit" loading={isSavingPassword} className="mt-1 w-fit px-5">
              {t('entryAccountDetail.changePasswordSubmit')}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
