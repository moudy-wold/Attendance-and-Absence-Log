import { useCallback, useRef, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import * as LocalAuthentication from 'expo-local-authentication'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { validateQrToken, recordAttendance, type QrAction } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { Button } from '../../Global/Button'
import { useAuth } from '../../../context/authContextValue'
import { supportedLanguages } from '../../../i18n'
import { tw } from '../../../lib/tw'

type Step =
  | { name: 'scanning' }
  | { name: 'validating' }
  | { name: 'authenticating'; token: string; action: QrAction }
  | { name: 'recording'; token: string; action: QrAction }
  | { name: 'success'; action: QrAction; at: string }
  | { name: 'error'; message: string }

const languageLabels: Record<string, string> = { ar: 'ع', tr: 'TR', en: 'EN' }

function TopBar({ onLogout }: { onLogout: () => void }) {
  const { i18n } = useTranslation()

  return (
    <View style={tw`absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pt-4`}>
      <Pressable
        onPress={onLogout}
        hitSlop={8}
        style={tw`size-9 items-center justify-center rounded-full bg-black/50`}
      >
        <Ionicons name="log-out-outline" size={18} color="white" />
      </Pressable>

      <View style={tw`flex-row gap-1 rounded-full bg-black/50 p-1`}>
        {supportedLanguages.map((lng) => {
          const active = i18n.resolvedLanguage === lng
          return (
            <Pressable
              key={lng}
              onPress={() => i18n.changeLanguage(lng)}
              style={tw`size-7 items-center justify-center rounded-full ${active ? 'bg-white' : ''}`}
            >
              <Text style={tw`text-[10px] font-semibold ${active ? 'text-neutral-900' : 'text-white'}`}>
                {languageLabels[lng]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function HomeScreenContent() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()
  const [step, setStep] = useState<Step>({ name: 'scanning' })
  const isProcessingRef = useRef(false)

  const resetToScanning = useCallback(() => {
    isProcessingRef.current = false
    setStep({ name: 'scanning' })
  }, [])

  const authenticate = useCallback(
    async (token: string, action: QrAction) => {
      setStep({ name: 'authenticating', token, action })
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('Confirm it’s you'),
      })

      if (!result.success) {
        setStep({ name: 'error', message: t('Identity verification failed, try scanning again') })
        return
      }

      setStep({ name: 'recording', token, action })
      try {
        const { data } = await recordAttendance(token)
        setStep({
          name: 'success',
          action: data.check_out ? 'check_out' : 'check_in',
          at: data.check_out ?? data.check_in,
        })
      } catch (error) {
        setStep({ name: 'error', message: extractApiError(error, t('Something went wrong, please try again')) })
      }
    },
    [t],
  )

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      setStep({ name: 'validating' })

      try {
        const { data } = await validateQrToken(result.data)
        if (!data.valid) {
          setStep({ name: 'error', message: t('This code is invalid or has expired, try scanning again') })
          return
        }
        await authenticate(result.data, data.action)
      } catch (error) {
        setStep({ name: 'error', message: extractApiError(error, t('This code is invalid or has expired, try scanning again')) })
      }
    },
    [authenticate, t],
  )

  if (!permission) {
    return <View style={tw`flex-1 bg-black`} />
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 items-center justify-center gap-4 bg-neutral-50 p-6 dark:bg-neutral-950`}>
        <Text style={tw`text-center text-sm text-neutral-600 dark:text-neutral-300`}>
          {t('Camera access is needed to scan the attendance code.')}
        </Text>
        <Button onPress={requestPermission}>{t('Allow camera access')}</Button>
        <Button variant="secondary" onPress={logout}>
          {t('Sign out')}
        </Button>
      </View>
    )
  }

  return (
    <View style={tw`flex-1 bg-black`}>
      {step.name === 'scanning' || step.name === 'validating' ? (
        <CameraView
          style={tw`flex-1`}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={step.name === 'scanning' ? handleBarcodeScanned : undefined}
        />
      ) : (
        <View style={tw`flex-1 items-center justify-center gap-5 bg-neutral-50 p-6 dark:bg-neutral-950`}>
          {step.name === 'authenticating' && (
            <Text style={tw`text-center text-sm text-neutral-600 dark:text-neutral-300`}>
              {t('Confirm your identity to continue')}
            </Text>
          )}

          {step.name === 'recording' && (
            <Text style={tw`text-center text-sm text-neutral-600 dark:text-neutral-300`}>{t('Recording your attendance…')}</Text>
          )}

          {step.name === 'success' && (
            <>
              <View style={tw`size-16 items-center justify-center rounded-full bg-emerald-100`}>
                <Text style={tw`text-2xl`}>✓</Text>
              </View>
              <Text style={tw`text-center text-base font-semibold text-neutral-900 dark:text-white`}>
                {step.action === 'check_in' ? t('Check-in recorded') : t('Check-out recorded')}
              </Text>
              <Button onPress={resetToScanning}>{t('Scan again')}</Button>
            </>
          )}

          {step.name === 'error' && (
            <>
              <Text style={tw`text-center text-sm text-red-500`}>{step.message}</Text>
              <View style={tw`w-full gap-3`}>
                <Button onPress={resetToScanning}>{t('Scan again')}</Button>
              </View>
            </>
          )}
        </View>
      )}

      {step.name === 'scanning' && (
        <>
          <TopBar onLogout={logout} />

          <View style={tw`absolute inset-x-0 bottom-10 items-center gap-3 px-6`}>
            <Text style={tw`rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white`}>
              {t('Point the camera at the screen at the entrance')}
            </Text>
            <Pressable
              onPress={() => router.push('/history')}
              style={tw`flex-row items-center gap-2 rounded-full bg-black/60 px-5 py-2.5`}
            >
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={tw`text-sm font-medium text-white`}>{t('My attendance')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}
