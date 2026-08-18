import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getUser, updateUser } from '../../../api/admin'
import { mapUser, type User } from '../../../types/user'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { Badge } from '../../Global/Badge'
import { Switch } from '../../Global/Switch'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { Button } from '../../Global/Button'
import { ConfirmDialog } from '../../Global/ConfirmDialog'

interface InfoForm {
  firstName: string
  lastName: string
  phone: string
  email: string
  type: string
  tc: string
  entity: string
}

interface PasswordForm {
  newPassword: string
}

const initialPasswordForm: PasswordForm = { newPassword: '' }

export function EmployeeDetailPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)

  const [employee, setEmployee] = useState<User | null>(null)
  const [infoForm, setInfoForm] = useState<InfoForm | null>(null)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isResetDeviceConfirmOpen, setIsResetDeviceConfirmOpen] = useState(false)

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const load = useCallback(() => {
    getUser(employeeId)
      .then(({ data }) => {
        const mapped = mapUser(data)
        setEmployee(mapped)
        setInfoForm({
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          phone: mapped.phone,
          email: mapped.email ?? '',
          type: mapped.type ?? '',
          tc: mapped.tc ?? '',
          entity: mapped.entity ?? '',
        })
      })
      .catch((error) => toast.error(extractApiError(error, t('Something went wrong, please try again'))))
  }, [employeeId, t])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdate(payload: Parameters<typeof updateUser>[1]) {
    if (!employee) return
    try {
      const { data } = await updateUser(employee.id, payload)
      setEmployee(mapUser(data))
      toast.success(t('Saved'))
    } catch (error) {
      toast.error(extractApiError(error, t('Something went wrong, please try again')))
    }
  }

  async function handleResetDevice() {
    setIsResetDeviceConfirmOpen(false)
    await handleUpdate({ device_id: null })
    toast.success(t('Device unbound'))
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault()
    if (!infoForm) return

    setIsSavingInfo(true)
    try {
      const { data } = await updateUser(employeeId, {
        first_name: infoForm.firstName.trim(),
        last_name: infoForm.lastName.trim(),
        phone: infoForm.phone.trim(),
        email: infoForm.email.trim() || undefined,
        type: infoForm.type.trim() || null,
        tc: infoForm.tc.trim() || null,
        entity: infoForm.entity.trim() || null,
      })
      setEmployee(mapUser(data))
      toast.success(t('Saved'))
    } catch (error) {
      toast.error(extractApiError(error, t('Something went wrong, please try again')))
    } finally {
      setIsSavingInfo(false)
    }
  }

  function validatePassword(): Partial<Record<keyof PasswordForm, string>> {
    const next: Partial<Record<keyof PasswordForm, string>> = {}
    if (passwordForm.newPassword.length < 8) next.newPassword = t('Password must be at least 8 characters')
    return next
  }

  async function handleSavePassword(e: FormEvent) {
    e.preventDefault()

    const validationErrors = validatePassword()
    setPasswordErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSavingPassword(true)
    try {
      await updateUser(employeeId, { password: passwordForm.newPassword })
      toast.success(t('Password updated'))
      setPasswordForm(initialPasswordForm)
    } catch (error) {
      toast.error(extractApiError(error, t('Something went wrong, please try again')))
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={employee?.fullName ?? '…'} onBack={() => navigate('/employees')} />

      {!employee || !infoForm ? (
        <div className="p-6">
          <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">{employee.fullName}</h2>
              <Badge tone="neutral">{t('Employee')}</Badge>
            </div>
            <p className="text-sm text-neutral-500">{employee.username}</p>

            <Switch
              label={t('Account active')}
              description={t('When off, this person cannot log in or use the app at all')}
              checked={employee.isActive}
              onChange={(checked) => handleUpdate({ is_active: checked })}
            />

            <Switch
              label={t('Regular')}
              description={t('Registered with the labor syndicate')}
              checked={employee.isRegular}
              onChange={(checked) => handleUpdate({ is_regular: checked })}
            />

            <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-neutral-800">{t('Bound device')}</span>
                <span className="text-xs text-neutral-500">
                  {employee.deviceId ? t('Bound to a device') : t('Not bound to any device yet')}
                </span>
              </span>
              {employee.deviceId && (
                <button
                  type="button"
                  onClick={() => setIsResetDeviceConfirmOpen(true)}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  {t('Allow login from a new device')}
                </button>
              )}
            </div>
          </section>

          <form
            onSubmit={handleSaveInfo}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-800">{t('Account info')}</h2>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label={t('First name')}
                value={infoForm.firstName}
                onChange={(e) => setInfoForm({ ...infoForm, firstName: e.target.value })}
              />
              <TextField
                label={t('Last name')}
                value={infoForm.lastName}
                onChange={(e) => setInfoForm({ ...infoForm, lastName: e.target.value })}
              />
            </div>

            <TextField
              label={t('Phone number')}
              value={infoForm.phone}
              onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
              type="tel"
            />

            <TextField
              label={t('Email (optional)')}
              value={infoForm.email}
              onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
              type="email"
            />

            <TextField
              label={t('National ID number (TC)')}
              value={infoForm.tc}
              onChange={(e) => setInfoForm({ ...infoForm, tc: e.target.value })}
            />

            <TextField
              label={t('Duty type (optional)')}
              value={infoForm.type}
              onChange={(e) => setInfoForm({ ...infoForm, type: e.target.value })}
            />

            <TextField
              label={t('Entity (optional)')}
              value={infoForm.entity}
              onChange={(e) => setInfoForm({ ...infoForm, entity: e.target.value })}
            />

            <Button type="submit" loading={isSavingInfo} className="mt-1 w-fit px-5">
              {t('Save')}
            </Button>
          </form>

          <form
            onSubmit={handleSavePassword}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-800">{t('Change password')}</h2>

            <PasswordField
              label={t('New password')}
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                setPasswordErrors({ ...passwordErrors, newPassword: undefined })
              }}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
            />

            <Button type="submit" loading={isSavingPassword} className="mt-1 w-fit px-5">
              {t('Update password')}
            </Button>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={isResetDeviceConfirmOpen}
        description={t(
          'Unbind this account from its current device? They will be able to log in from a new device next time.',
        )}
        confirmText={t('Unbind')}
        variant="danger"
        onConfirm={handleResetDevice}
        onCancel={() => setIsResetDeviceConfirmOpen(false)}
      />
    </div>
  )
}
