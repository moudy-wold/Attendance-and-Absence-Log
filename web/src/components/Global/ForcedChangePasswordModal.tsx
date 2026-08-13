import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { changePassword } from '../../api/auth'
import { extractApiError } from '../../lib/apiError'
import { useAuth } from '../../context/authContextValue'
import { PasswordField } from './PasswordField'
import { Button } from './Button'

interface Form {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const initialForm: Form = { oldPassword: '', newPassword: '', confirmPassword: '' }
const fieldOrder: (keyof Form)[] = ['oldPassword', 'newPassword', 'confirmPassword']

export function ForcedChangePasswordModal() {
  const { t } = useTranslation()
  const { updateUser } = useAuth()

  const [form, setForm] = useState<Form>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): Partial<Record<keyof Form, string>> {
    const next: Partial<Record<keyof Form, string>> = {}
    if (!form.oldPassword) next.oldPassword = t('changePassword.oldPasswordRequired')
    if (form.newPassword.length < 8) next.newPassword = t('changePassword.tooShort')
    else if (/^\d+$/.test(form.newPassword)) next.newPassword = t('changePassword.numericOnly')
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = t('changePassword.mismatch')
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      const firstKey = fieldOrder.find((key) => validationErrors[key])
      if (firstKey) toast.error(validationErrors[firstKey]!)
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ old_password: form.oldPassword, new_password: form.newPassword })
      updateUser({ isFirstLogin: false })
      toast.success(t('changePassword.success'))
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
      >
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t('changePassword.title')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('changePassword.subtitle')}</p>
        </div>

        <PasswordField
          label={t('changePassword.oldPassword')}
          value={form.oldPassword}
          onChange={handleChange('oldPassword')}
          error={errors.oldPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label={t('changePassword.newPassword')}
          value={form.newPassword}
          onChange={handleChange('newPassword')}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <PasswordField
          label={t('changePassword.confirmPassword')}
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" loading={isSubmitting} className="mt-2">
          {t('changePassword.submit')}
        </Button>
      </form>
    </div>
  )
}
