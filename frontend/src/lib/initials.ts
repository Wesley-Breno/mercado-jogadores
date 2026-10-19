/** First letter of the first and of the last word: "Davi Melo" → "DM". */
export function initials(name: string): string {
  const words = name.split(' ').filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}
