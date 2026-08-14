import { View, Text } from 'react-native'
import { tw } from '../../lib/tw'

type BadgeTone = 'neutral' | 'green' | 'red' | 'amber'

const containerTones: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 dark:bg-neutral-800',
  green: 'bg-emerald-50 dark:bg-emerald-950',
  red: 'bg-red-50 dark:bg-red-950',
  amber: 'bg-amber-50 dark:bg-amber-950',
}

const textTones: Record<BadgeTone, string> = {
  neutral: 'text-neutral-600 dark:text-neutral-300',
  green: 'text-emerald-700 dark:text-emerald-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-700 dark:text-amber-400',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: string }) {
  return (
    <View style={tw`self-start rounded-full px-2.5 py-1 ${containerTones[tone]}`}>
      <Text style={tw`text-xs font-medium ${textTones[tone]}`}>{children}</Text>
    </View>
  )
}
