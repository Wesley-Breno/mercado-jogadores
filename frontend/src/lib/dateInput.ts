const TYPED_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/
const TYPED_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Keeps only digits and puts the slashes while the date is typed: "12112027" → "12/11/2027". */
export function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** Same for the time: "1530" → "15:30". */
export function maskTime(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits
}

/** A date that exists in the calendar, typed as dd/mm/aaaa ("31/02/2027" does not). */
export function isRealDate(text: string): boolean {
  const match = TYPED_DATE.exec(text)
  if (!match) {
    return false
  }
  const [day, month, year] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    year >= 1000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function isRealTime(text: string): boolean {
  return TYPED_TIME.test(text)
}

/** "12/11/2027" and "15:00" typed in Brasília time → "2027-11-12T15:00" (RN01 without the zone). */
export function toLocalDateTime(date: string, time: string): string {
  const [day, month, year] = date.split('/')
  return `${year}-${month}-${day}T${time}`
}
