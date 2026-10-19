const TIME_ZONE = 'America/Sao_Paulo'

const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const integer = new Intl.NumberFormat('pt-BR')

const date = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const time = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Amounts in "moedas": 2 places and decimal comma (1.234,50). */
export function formatMoney(value: number): string {
  return money.format(value)
}

/** Cash change with an explicit sign: "+" for money in, "-" for money out. */
export function formatSignedMoney(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${money.format(Math.abs(value))}`
}

/** Whole numbers with the thousands separator: 1089 → "1.089". */
export function formatInteger(value: number): string {
  return integer.format(value)
}

/** API dates (already -03:00) in Brasília time, whatever the computer time zone is. */
export function dateTimeParts(value: string): { date: string; time: string } {
  const instant = new Date(value)
  return { date: date.format(instant), time: time.format(instant) }
}

/** "07/11/2026 10:30", as in the mockup. */
export function formatDateTime(value: string): string {
  const parts = dateTimeParts(value)
  return `${parts.date} ${parts.time}`
}

/** RN01: a datetime-local value (AAAA-MM-DDTHH:MM) typed in Brasília time, sent with -03:00. */
export function toApiDateTime(localValue: string): string {
  return `${localValue}-03:00`
}
