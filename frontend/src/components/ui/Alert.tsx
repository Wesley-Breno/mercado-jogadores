import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

/** Shows the `message` of a refusal; screen readers read it as soon as it appears. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
