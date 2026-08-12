import { useState } from 'react'
import { View, Text } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { isAxiosError } from 'axios'
import { TextField } from '../../Global/TextField'
import { PasswordField } from '../../Global/PasswordField'
import { Button } from '../../Global/Button'
import { LanguageSwitcher } from '../../Global/LanguageSwitcher'
import { useAuth } from '../../../context/authContextValue'
import { tw } from '../../../lib/tw'

interface LoginForm {
  username: string
  password: string
}

const fieldOrder: (keyof LoginForm)[] = ['username', 'password']

export function LoginScreenContent() {
  const { t } = useTranslation()
  const { login } = useAuth()

  const [form, setForm] = useState<LoginForm>({ username: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof LoginForm) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
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

  async function handleSubmit() {
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      const firstKey = fieldOrder.find((key) => validationErrors[key])
      if (firstKey) Toast.show({ type: 'error', text1: validationErrors[firstKey] })
      return
    }

    setIsSubmitting(true)
    setTopError(null)
    try {
      await login(form)
      router.replace('/')
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setTopError(t('auth.invalidCredentials'))
        Toast.show({ type: 'error', text1: t('auth.invalidCredentials') })
      } else if (isAxiosError(error) && error.response?.status === 403) {
        setTopError(t('auth.accountSuspended'))
        Toast.show({ type: 'error', text1: t('auth.accountSuspended') })
      } else {
        Toast.show({ type: 'error', text1: t('common.unexpectedError') })
      }
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
      <View style={tw`self-end`}>
        <LanguageSwitcher />
      </View>

      <View
        style={tw`gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900`}
      >
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>
          {t('auth.loginTitle')}
        </Text>

        {topError && (
          <View style={tw`rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5`}>
            <Text style={tw`text-sm text-red-600`}>{topError}</Text>
          </View>
        )}

        <TextField
          label={t('auth.username')}
          value={form.username}
          onChangeText={handleChange('username')}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <PasswordField
          label={t('auth.password')}
          value={form.password}
          onChangeText={handleChange('password')}
          error={errors.password}
        />

        <Button onPress={handleSubmit} loading={isSubmitting}>
          {t('auth.submit')}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  )
}
