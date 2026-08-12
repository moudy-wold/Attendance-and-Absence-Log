import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'
import { tw } from '../../lib/tw'

interface ButtonProps extends PressableProps {
  loading?: boolean
  children: string
}

export function Button({ loading, disabled, children, style, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        tw`h-11 flex-row items-center justify-center gap-2 rounded-lg bg-neutral-900 dark:bg-white ${
          disabled || loading ? 'opacity-50' : state.pressed ? 'opacity-80' : ''
        }`,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={tw.color('white')} />}
      <Text style={tw`text-sm font-medium text-white dark:text-neutral-900`}>{children}</Text>
    </Pressable>
  )
}
