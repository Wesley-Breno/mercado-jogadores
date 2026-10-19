import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ icon: Icon, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
          <Icon aria-hidden className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {action}
    </header>
  )
}
