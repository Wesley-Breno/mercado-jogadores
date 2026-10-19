import { AlertTriangle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from './Button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

type ErrorStateProps = {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        <AlertTriangle aria-hidden className="size-5" />
      </span>
      <p className="mt-3 font-semibold">Não foi possível carregar</p>
      <p className="mt-1 max-w-md text-sm text-zinc-500">{message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  )
}
