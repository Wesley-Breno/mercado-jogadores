const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
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

/** API dates (already -03:00) shown in Brasília time, whatever the computer time zone is. */
export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value))
}

/** RN01: a datetime-local value (AAAA-MM-DDTHH:MM) typed in Brasília time, sent with -03:00. */
export function toApiDateTime(localValue: string): string {
  return `${localValue}-03:00`
}
