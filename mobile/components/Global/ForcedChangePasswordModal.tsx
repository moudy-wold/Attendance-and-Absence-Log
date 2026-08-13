import { useState } from 'react'
import { View, Text } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import { changePassword } from '../../api'
import { extractApiError } from '../../lib/apiError'
import { PasswordField } from './PasswordField'
import { Button } from './Button'
import { tw } from '../../lib/tw'

interface Form {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const initialForm: Form = { oldPassword: '', newPassword: '', confirmPassword: '' }
const fieldOrder: (keyof Form)[] = ['oldPassword', 'newPassword', 'confirmPassword']

interface ForcedChangePasswordModalProps {
  /** The password just used to log in — prefilled and locked, since we already know it. */
  currentPassword?: string
  onSuccess: () => void
}

export function ForcedChangePasswordModal({ currentPassword, onSuccess }: ForcedChangePasswordModalProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState<Form>({ ...initialForm, oldPassword: currentPassword ?? '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof Form) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
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

  async function handleSubmit() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      const firstKey = fieldOrder.find((key) => validationErrors[key])
      if (firstKey) Toast.show({ type: 'error', text1: validationErrors[firstKey] })
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ old_password: form.oldPassword, new_password: form.newPassword })
      Toast.show({ type: 'success', text1: t('changePassword.success') })
      onSuccess()
    } catch (error) {
      Toast.show({ type: 'error', text1: extractApiError(error, t('common.unexpectedError')) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAwareScrollView
      style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}
      contentContainerStyle={tw`flex-grow justify-center gap-6 px-5 py-10`}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View
        style={tw`gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900`}
      >
        <View>
          <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>
            {t('changePassword.title')}
          </Text>
          <Text style={tw`mt-1 text-sm text-neutral-500`}>{t('changePassword.subtitle')}</Text>
        </View>

        <PasswordField
          label={t('changePassword.oldPassword')}
          value={form.oldPassword}
          onChangeText={handleChange('oldPassword')}
          error={errors.oldPassword}
          editable={!currentPassword}
        />
        <PasswordField
          label={t('changePassword.newPassword')}
          value={form.newPassword}
          onChangeText={handleChange('newPassword')}
          error={errors.newPassword}
        />
        <PasswordField
          label={t('changePassword.confirmPassword')}
          value={form.confirmPassword}
          onChangeText={handleChange('confirmPassword')}
          error={errors.confirmPassword}
        />

        <Button onPress={handleSubmit} loading={isSubmitting}>
          {t('changePassword.submit')}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  )
}
