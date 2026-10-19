/** Trims the ends and turns repeated spaces into one, as the API does before validating (V4). */
export function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/** "Patrimônio (maior para o menor)" → "patrimônio (maior para o menor)", for "Ordenar: …". */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}
