const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Values as the screen must show them: 2 places and decimal comma. */
export function brl(value: number): string {
  return money.format(value)
}

/** Cash change and profit with the sign the screen shows: "+35,70", "-38,85". */
export function signed(value: number): string {
  return value > 0 ? `+${brl(value)}` : value < 0 ? `-${brl(-value)}` : brl(0)
}
