import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useId } from 'react'

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
  inline?: boolean
  className?: string
  children: (control: ControlProps) => ReactNode
}

function FieldMessage({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  const message = error ?? hint
  if (!message) {
    return null
  }
  return (
    <p id={id} className={cn('text-xs', error ? 'text-red-600' : 'text-zinc-500')}>
      {message}
    </p>
  )
}

/**
 * Visible label, the control, and below it the error (or the hint), linked for screen readers.
 * Inline puts the label and the hint on the left of the control, for rows of a list.
 */
export function Field({ label, hint, error, inline = false, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const hintId = `${id}-hint`
  const describedBy = inline
    ? [hint && hintId, error && messageId].filter(Boolean).join(' ')
    : error || hint
      ? messageId
      : ''
  const control = children({
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy || undefined,
  })
  if (inline) {
    return (
      <div className={cn('grid gap-1.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-4', className)}>
        <div className="sm:pt-2">
          <label htmlFor={id} className="block text-sm font-medium">
            {label}
          </label>
          {hint && (
            <span id={hintId} className="block text-xs text-zinc-500">
              {hint}
            </span>
          )}
        </div>
        <div className="grid content-start gap-1.5">
          {control}
          <FieldMessage id={messageId} error={error} />
        </div>
      </div>
    )
  }
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {control}
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  )
}

type FieldsetProps = {
  legend: string
  hint?: string
  error?: string
  children: ReactNode
}

/** Same as Field for a group of options, such as radio cards. */
export function Fieldset({ legend, hint, error, children }: FieldsetProps) {
  const messageId = useId()
  return (
    <fieldset
      aria-invalid={Boolean(error)}
      aria-describedby={error || hint ? messageId : undefined}
      className="grid gap-1.5"
    >
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      {children}
      <FieldMessage id={messageId} hint={hint} error={error} />
    </fieldset>
  )
}

/** Focus and error look shared by the text fields and the selects. */
const CONTROL = cn(
  'focus-visible:border-blue-600 focus-visible:ring-3 focus-visible:ring-blue-600/20 focus-visible:outline-none',
  'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 disabled:bg-zinc-50 disabled:text-zinc-500',
)

function LeadingIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
    />
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon
}

export function Input({ className, icon: Icon, ...props }: InputProps) {
  const input = (
    <input
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-xs tabular-nums transition-colors placeholder:text-zinc-400',
        CONTROL,
        Icon && 'pl-9',
        className,
      )}
      {...props}
    />
  )
  if (!Icon) {
    return input
  }
  return (
    <span className="relative block">
      <LeadingIcon icon={Icon} />
      {input}
    </span>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: LucideIcon
}

/** Native select, so it works inside dialogs and with the keyboard and screen readers as is. */
export function Select({ className, icon: Icon, children, ...props }: SelectProps) {
  return (
    <span className="relative block">
      {Icon && <LeadingIcon icon={Icon} />}
      <select
        className={cn(
          'h-9 w-full min-w-0 appearance-none rounded-lg border border-zinc-200 bg-white pr-9 pl-3 text-sm shadow-xs transition-colors',
          CONTROL,
          Icon && 'pl-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500"
      />
    </span>
  )
}
