import { useCallback, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import * as LocalAuthentication from 'expo-local-authentication'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { validateQrToken, recordAttendance, type QrAction } from '../../../api'
import { extractApiError } from '../../../lib/apiError'
import { Button } from '../../Global/Button'
import { tw } from '../../../lib/tw'

type Step =
  | { name: 'scanning' }
  | { name: 'validating' }
  | { name: 'authenticating'; token: string; action: QrAction }
  | { name: 'recording'; token: string; action: QrAction }
  | { name: 'success'; action: QrAction; at: string }
  | { name: 'error'; message: string }

export function ScanScreenContent() {
  const { t } = useTranslation()
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
        promptMessage: t('scan.biometricPrompt'),
      })

      if (!result.success) {
        setStep({ name: 'error', message: t('scan.biometricFailed') })
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
        setStep({ name: 'error', message: extractApiError(error, t('common.unexpectedError')) })
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
          setStep({ name: 'error', message: t('scan.invalidCode') })
          return
        }
        await authenticate(result.data, data.action)
      } catch (error) {
        setStep({ name: 'error', message: extractApiError(error, t('scan.invalidCode')) })
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
          {t('scan.cameraPermission')}
        </Text>
        <Button onPress={requestPermission}>{t('scan.grantPermission')}</Button>
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
              {t('scan.waitingBiometric')}
            </Text>
          )}

          {step.name === 'recording' && (
            <Text style={tw`text-center text-sm text-neutral-600 dark:text-neutral-300`}>{t('scan.saving')}</Text>
          )}

          {step.name === 'success' && (
            <>
              <View style={tw`size-16 items-center justify-center rounded-full bg-emerald-100`}>
                <Text style={tw`text-2xl`}>✓</Text>
              </View>
              <Text style={tw`text-center text-base font-semibold text-neutral-900 dark:text-white`}>
                {step.action === 'check_in' ? t('scan.checkedIn') : t('scan.checkedOut')}
              </Text>
              <Button onPress={() => router.replace('/')}>{t('scan.backHome')}</Button>
            </>
          )}

          {step.name === 'error' && (
            <>
              <Text style={tw`text-center text-sm text-red-500`}>{step.message}</Text>
              <View style={tw`w-full gap-3`}>
                <Button onPress={resetToScanning}>{t('scan.tryAgain')}</Button>
              </View>
            </>
          )}
        </View>
      )}

      {step.name === 'scanning' && (
        <View style={tw`absolute inset-x-0 bottom-10 items-center px-6`}>
          <Text style={tw`rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white`}>
            {t('scan.instructions')}
          </Text>
        </View>
      )}
    </View>
  )
}
