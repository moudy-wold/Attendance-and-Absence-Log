import { View, Text } from 'react-native'
import { tw } from '../../lib/tw'

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={tw`w-[47%] gap-1 rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900`}
    >
      <Text style={tw`text-xs font-medium text-neutral-500`}>{label}</Text>
      <Text style={tw`text-xl font-semibold text-neutral-900 dark:text-white`}>{value}</Text>
    </View>
  )
}
