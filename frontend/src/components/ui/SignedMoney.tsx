import { cn } from '../../lib/cn'
import { formatSignedMoney } from '../../lib/format'

/** "+" for money in (green), "-" for money out (red), as RN17 asks for the cash change. */
export function SignedMoney({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <span
      className={cn(
        strong && 'font-semibold',
        value > 0 && 'text-green-700',
        value < 0 && 'text-red-600',
      )}
    >
      {formatSignedMoney(value)}
    </span>
  )
}
