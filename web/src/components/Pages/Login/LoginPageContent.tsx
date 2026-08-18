import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { ForcedChangePasswordModal } from '../../Global/ForcedChangePasswordModal'
import { useAuth } from '../../../context/authContextValue'
import { extractApiError } from '../../../lib/apiError'

interface LoginForm {
  username: string
  password: string
}

const initialForm: LoginForm = { username: '', password: '' }
const fieldOrder: (keyof LoginForm)[] = ['username', 'password']

export function LoginPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, logout } = useAuth()

  const [form, setForm] = useState<LoginForm>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  function handleChange(field: keyof LoginForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setTopError(null)
    }
  }

  function validate(): Partial<Record<keyof LoginForm, string>> {
    const next: Partial<Record<keyof LoginForm, string>> = {}
    if (!form.username.trim()) next.username = t('Please enter your national ID number')
    if (!form.password) next.password = t('Please enter your password')
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
    setTopError(null)
    try {
      const loggedInUser = await login(form)
      if (loggedInUser.isFirstLogin) {
        setMustChangePassword(true)
        return
      }
      navigate(loggedInUser.isEntry ? '/kiosk' : '/', { replace: true })
    } catch (error) {
      const message =
        isAxiosError(error) && error.response?.status === 401
          ? t('Invalid national ID or password')
          : extractApiError(error, t('Something went wrong, please try again'))
      setTopError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePasswordChanged() {
    // Discard the temporary session from the first login — they must sign in
    // again with the new password, they never actually entered the app.
    logout()
    setMustChangePassword(false)
    setForm(initialForm)
    toast.success(t('Password changed — please sign in again with your new password.'))
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-neutral-50 px-4 py-10">
      {mustChangePassword ? (
        <ForcedChangePasswordModal currentPassword={form.password} onSuccess={handlePasswordChanged} />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-neutral-900">{t('Login')}</h1>

          {topError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {topError}
            </div>
          )}

          <TextField
            label={t('National ID number (TC)')}
            value={form.username}
            onChange={handleChange('username')}
            error={errors.username}
            autoComplete="username"
          />

          <PasswordField
            label={t('Password')}
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" loading={isSubmitting}>
            {t('Sign in')}
          </Button>
          <div className="max-w-sm mx-auto ">
            <LanguageSwitcher />
          </div>
        </form>
      )}
    </div>
  )
}
