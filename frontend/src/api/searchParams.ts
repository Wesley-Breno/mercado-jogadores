type QueryValue = string | number | boolean | undefined

/** "?a=1&b=x" from the defined values, in the given order; "" when there is none. */
export function toSearchParams(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}
