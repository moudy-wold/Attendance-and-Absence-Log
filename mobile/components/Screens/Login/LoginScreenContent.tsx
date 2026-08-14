import { useRef, useState } from 'react'
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
import { ForcedChangePasswordModal } from '../../Global/ForcedChangePasswordModal'
import { useAuth } from '../../../context/authContextValue'
import { extractApiError } from '../../../lib/apiError'
import { tw } from '../../../lib/tw'

interface LoginForm {
  username: string
  password: string
}

const initialForm: LoginForm = { username: '', password: '' }
const fieldOrder: (keyof LoginForm)[] = ['username', 'password']

export function LoginScreenContent() {
  const { t } = useTranslation()
  const { login, logout } = useAuth()
  const passwordRef = useRef<any>(null)
  const [form, setForm] = useState<LoginForm>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  function handleChange(field: keyof LoginForm) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setTopError(null)
    }
  }

  function validate(): Partial<Record<keyof LoginForm, string>> {
    const next: Partial<Record<keyof LoginForm, string>> = {}
    if (!form.username.trim()) next.username = t('Please enter your username or phone number')
    if (!form.password) next.password = t('Please enter your password')
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
      const loggedInUser = await login(form)
      if (loggedInUser.isFirstLogin) {
        setMustChangePassword(true)
        return
      }
      router.replace('/')
    } catch (error) {
      const message =
        isAxiosError(error) && error.response?.status === 401
          ? t('Invalid username or password')
          : extractApiError(error, t('Something went wrong, please try again'))
      setTopError(message)
      Toast.show({ type: 'error', text1: message })
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
    Toast.show({ type: 'success', text1: t('Password changed — please sign in again with your new password.') })
  }

  if (mustChangePassword) {
    return <ForcedChangePasswordModal currentPassword={form.password} onSuccess={handlePasswordChanged} />
  }

  return (
    <KeyboardAwareScrollView
      style={tw`flex-1 bg-neutral-50 dark:bg-neutral-950`}
      contentContainerStyle={tw`flex-grow justify-center gap-6 px-5 py-10`}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={tw`mx-auto `}>
        <LanguageSwitcher />
      </View>

      <View
        style={tw`gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900`}
      >
        <Text style={tw`text-lg font-semibold text-neutral-900 dark:text-white`}>
          {t('Login')}
        </Text>

        {topError && (
          <View style={tw`rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5`}>
            <Text style={tw`text-sm text-red-600`}>{topError}</Text>
          </View>
        )}

        <TextField
          label={t('Username or phone number')}
          value={form.username}
          onChangeText={handleChange('username')}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <PasswordField
          label={t('Password')}
          value={form.password}
          onChangeText={handleChange('password')}
          error={errors.password}
          ref={passwordRef}
        />

        <Button onPress={handleSubmit} loading={isSubmitting}>
          {t('Sign in')}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  )
}
