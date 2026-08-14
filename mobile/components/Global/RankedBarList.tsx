import { View, Text } from 'react-native'
import { tw } from '../../lib/tw'

interface RankedBarListProps {
  items: { id: number; name: string; value: number }[]
  emptyLabel: string
  color?: string
}

export function RankedBarList({ items, emptyLabel, color = '#2a78d6' }: RankedBarListProps) {
  if (items.length === 0) {
    return <Text style={tw`py-6 text-center text-sm text-neutral-400`}>{emptyLabel}</Text>
  }

  const maxValue = Math.max(1, ...items.map((item) => item.value))

  return (
    <View style={tw`gap-2.5`}>
      {items.map((item) => (
        <View key={item.id} style={tw`gap-1`}>
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <Text style={tw`flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-200`} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={tw`text-xs text-neutral-500`}>{item.value}</Text>
          </View>
          <View style={tw`h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800`}>
            <View
              style={[
                tw`h-full rounded-full`,
                { width: `${(item.value / maxValue) * 100}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  )
}
