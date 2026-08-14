import { View, Text, ScrollView } from 'react-native'
import { tw } from '../../lib/tw'

const CHART_HEIGHT = 100

function dayOfMonth(iso: string) {
  return Number(iso.slice(-2))
}

interface DailyBarChartProps {
  data: { date: string; value: number }[]
  emptyLabel: string
  color?: string
}

export function DailyBarChart({ data, emptyLabel, color = '#2a78d6' }: DailyBarChartProps) {
  if (data.length === 0) {
    return <Text style={tw`py-8 text-center text-sm text-neutral-400`}>{emptyLabel}</Text>
  }

  const maxValue = Math.max(1, ...data.map((point) => point.value))

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={tw`h-[${CHART_HEIGHT + 20}px] flex-row items-end gap-2.5 px-1 py-2`}>
        {data.map((point) => {
          const barHeight = Math.max(2, Math.round((point.value / maxValue) * CHART_HEIGHT))
          return (
            <View key={point.date} style={tw`items-center gap-1`}>
              <View style={tw`h-[${CHART_HEIGHT}px] w-3.5 justify-end`}>
                <View style={[tw`w-3.5 rounded-t-sm`, { height: barHeight, backgroundColor: color }]} />
              </View>
              <Text style={tw`text-[9px] text-neutral-400`}>{dayOfMonth(point.date)}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
