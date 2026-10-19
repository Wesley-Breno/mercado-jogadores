import { type InputHTMLAttributes, type ReactNode, useId } from 'react'

import { cn } from '../../lib/cn'

type ControlProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

type FieldProps = {
  label: ReactNode
  hint?: string
  error?: string
  className?: string
  children: (control: ControlProps) => ReactNode
}

/** Visible label, the control, and below it the error (or the hint), linked for screen readers. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-red-600' : 'text-zinc-500')}>
          {message}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-xs tabular-nums transition-colors placeholder:text-zinc-400',
        'focus-visible:border-blue-600 focus-visible:ring-3 focus-visible:ring-blue-600/20 focus-visible:outline-none',
        'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
