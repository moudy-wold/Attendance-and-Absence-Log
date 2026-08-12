import { View, Text, TextInput, type TextInputProps } from 'react-native'
import { tw } from '../../lib/tw'

interface TextFieldProps extends TextInputProps {
  label: string
  error?: string
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={tw`gap-1.5`}>
      <Text style={tw`text-sm font-medium text-neutral-700 dark:text-neutral-300`}>{label}</Text>
      <TextInput
        style={[
          tw`h-11 rounded-lg border px-3.5 text-sm text-neutral-900 dark:text-white ${
            error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
          }`,
          style,
        ]}
        placeholderTextColor={tw.color('neutral-400')}
        {...props}
      />
      {error && <Text style={tw`text-xs text-red-500`}>{error}</Text>}
    </View>
  )
}
