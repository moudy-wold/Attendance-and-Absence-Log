import { useState } from 'react'
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tw } from '../../lib/tw'

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string
  error?: string
  ref?: React.Ref<TextInput>

}

export function PasswordField({ label, error, ref, style, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <View style={tw`gap-1.5`}>
      <Text style={tw`text-sm font-medium text-neutral-700 dark:text-neutral-300`}>{label}</Text>
      <View
        style={tw`h-11 flex-row items-center rounded-lg border px-3.5 ${error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
          }`}
      >
        <TextInput
          style={[tw`h-full flex-1 text-sm text-neutral-900 dark:text-white`, style]}
          secureTextEntry={!visible}
          placeholderTextColor={tw.color('neutral-400')}
          ref={ref}
          {...props}
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={tw.color('neutral-400')}
          />
        </Pressable>
      </View>
      {error && <Text style={tw`text-xs text-red-500`}>{error}</Text>}
    </View>
  )
}
