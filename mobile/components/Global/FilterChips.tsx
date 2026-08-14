import { View, Text, Pressable } from 'react-native'
import { tw } from '../../lib/tw'

interface FilterChipsProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function FilterChips<T extends string>({ label, value, options, onChange }: FilterChipsProps<T>) {
  return (
    <View style={tw`gap-1.5`}>
      <Text style={tw`text-xs font-medium text-neutral-500`}>{label}</Text>
      <View style={tw`flex-row flex-wrap gap-1.5`}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={tw`rounded-full border px-3 py-1.5 ${
                active
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text
                style={tw`text-xs font-medium ${
                  active ? 'text-white dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
