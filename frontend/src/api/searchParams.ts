type QueryValue = string | number | boolean | readonly string[] | undefined

/**
 * "?a=1&b=x" from the defined values, in the given order; "" when there is none. A list becomes
 * one comma-separated value, and the commas stay readable (`type=COMPRA,VENDA`), as in the API docs.
 */
export function toSearchParams(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    const text = Array.isArray(value) ? value.join(',') : value
    if (text !== undefined && text !== '') {
      params.set(key, String(text))
    }
  }
  const text = params.toString().replaceAll('%2C', ',')
  return text ? `?${text}` : ''
}
