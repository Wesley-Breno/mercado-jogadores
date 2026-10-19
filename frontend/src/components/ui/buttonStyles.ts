import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-xs hover:bg-blue-700',
  outline: 'border border-zinc-200 bg-white text-zinc-900 shadow-xs hover:bg-zinc-50',
  ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
  destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5',
  md: 'h-9 gap-2 px-3.5',
}

/** The look of a button, shared by real buttons and by links that look like buttons. */
export function buttonStyles(
  variant: ButtonVariant = 'outline',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
    'focus-visible:ring-3 focus-visible:ring-blue-600/30 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
