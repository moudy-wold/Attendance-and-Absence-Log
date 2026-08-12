import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'
import { tw } from '../../lib/tw'

interface ButtonProps extends PressableProps {
  loading?: boolean
  children: string
  variant?: 'primary' | 'secondary'
}

const containerVariants = {
  primary: 'bg-neutral-900 dark:bg-white',
  secondary: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700',
}

const textVariants = {
  primary: 'text-white dark:text-neutral-900',
  secondary: 'text-neutral-900 dark:text-white',
}

export function Button({ loading, disabled, children, variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        tw`h-11 flex-row items-center justify-center gap-2 rounded-lg ${containerVariants[variant]} ${
          disabled || loading ? 'opacity-50' : state.pressed ? 'opacity-80' : ''
        }`,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={tw.color(variant === 'primary' ? 'white' : 'neutral-900')} />}
      <Text style={tw`text-sm font-medium ${textVariants[variant]}`}>{children}</Text>
    </Pressable>
  )
}
