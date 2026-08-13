import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { registerUser } from '../../../api/admin'
import { extractApiError } from '../../../lib/apiError'
import { AdminHeader } from '../../Global/AdminHeader'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { SelectField } from '../../Global/Select'
import { Switch } from '../../Global/Switch'
import { Button } from '../../Global/Button'

type AccountType = 'employee' | 'entry'

interface EmployeeForm {
  password: string
  firstName: string
  lastName: string
  phone: string
  accountType: AccountType
  isRegular: boolean
}

const initialForm: EmployeeForm = {
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  accountType: 'employee',
  isRegular: true,
}

const fieldOrder: (keyof EmployeeForm)[] = ['firstName', 'lastName', 'phone', 'password']

export function CreateEmployeePageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState<EmployeeForm>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeForm, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange<K extends keyof EmployeeForm>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): Partial<Record<keyof EmployeeForm, string>> {
    const next: Partial<Record<keyof EmployeeForm, string>> = {}
    if (!form.firstName.trim()) next.firstName = t('employees.form.firstNameRequired')
    if (!form.lastName.trim()) next.lastName = t('employees.form.lastNameRequired')
    if (!form.phone.trim()) next.phone = t('employees.form.phoneRequired')
    if (form.password && form.password.length < 8) next.password = t('employees.form.passwordTooShort')
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
      await registerUser({
        password: form.password.trim() || undefined,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
        is_employee: form.accountType === 'employee',
        is_entry: form.accountType === 'entry',
        is_regular: form.accountType === 'employee' ? form.isRegular : true,
      })
      toast.success(t('employees.form.created'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(extractApiError(error, t('common.unexpectedError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <AdminHeader title={t('employees.form.title')} onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
        <SelectField
          label={t('employees.form.accountType')}
          value={form.accountType}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, accountType: e.target.value as AccountType }))
          }
        >
          <option value="employee">{t('employees.roleEmployee')}</option>
          <option value="entry">{t('employees.roleEntry')}</option>
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={t('employees.form.firstName')}
            value={form.firstName}
            onChange={handleChange('firstName')}
            error={errors.firstName}
          />
          <TextField
            label={t('employees.form.lastName')}
            value={form.lastName}
            onChange={handleChange('lastName')}
            error={errors.lastName}
          />
        </div>

        <TextField
          label={t('employees.form.phone')}
          value={form.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          type="tel"
        />

        <div>
          <PasswordField
            label={t('employees.form.password')}
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="new-password"
            placeholder={t('employees.form.passwordPlaceholder')}
          />
          <p className="mt-1.5 text-xs text-neutral-500">{t('employees.form.passwordHint')}</p>
        </div>

        {form.accountType === 'employee' && (
          <Switch
            label={t('employees.regular')}
            description={t('employees.form.regularDescription')}
            checked={form.isRegular}
            onChange={(checked) => setForm((prev) => ({ ...prev, isRegular: checked }))}
          />
        )}

        <Button type="submit" loading={isSubmitting} className="mt-2">
          {t('employees.form.submit')}
        </Button>
      </form>
    </div>
  )
}
