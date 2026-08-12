import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'

interface LoginForm {
  username: string
  password: string
}

const fieldOrder: (keyof LoginForm)[] = ['username', 'password']

export function LoginPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState<LoginForm>({ username: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof LoginForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setTopError(null)
    }
  }

  function validate(): Partial<Record<keyof LoginForm, string>> {
    const next: Partial<Record<keyof LoginForm, string>> = {}
    if (!form.username.trim()) next.username = t('auth.usernameRequired')
    if (!form.password) next.password = t('auth.passwordRequired')
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
      await login(form)
      navigate('/', { replace: true })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setTopError(t('auth.invalidCredentials'))
        toast.error(t('auth.invalidCredentials'))
      } else {
        toast.error(t('common.unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm self-end">
        <LanguageSwitcher />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-neutral-900">{t('auth.loginTitle')}</h1>

        {topError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {topError}
          </div>
        )}

        <TextField
          label={t('auth.username')}
          value={form.username}
          onChange={handleChange('username')}
          error={errors.username}
          autoComplete="username"
        />

        <PasswordField
          label={t('auth.password')}
          value={form.password}
          onChange={handleChange('password')}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" loading={isSubmitting}>
          {t('auth.submit')}
        </Button>
      </form>
    </div>
  )
}
