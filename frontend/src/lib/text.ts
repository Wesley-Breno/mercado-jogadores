/** Trims the ends and turns repeated spaces into one, as the API does before validating (V4). */
export function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}
