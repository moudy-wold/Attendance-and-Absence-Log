import { isAxiosError } from 'axios'

/** Extracts a human-readable message from a DRF error response: `{detail}` or `{field: [msg, ...]}`. */
export function extractApiError(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') return data.detail

      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const value = data[firstKey]
        if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
        if (typeof value === 'string') return value
      }
    }
  }
  return fallback
}
