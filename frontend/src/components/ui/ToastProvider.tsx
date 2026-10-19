import { CircleCheck, X } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { ToastContext, type ToastMessage } from './toastContext'

const VISIBLE_FOR_MS = 6000

type Toast = ToastMessage & { id: number }

type ToastItemProps = {
  toast: Toast
  onDismiss: (id: number) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), VISIBLE_FOR_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <li className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-green-700" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{toast.description}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar aviso"
        className="self-start rounded-md p-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
      >
        <X aria-hidden className="size-4" />
      </button>
    </li>
  )
}

/** Success notices, read aloud by screen readers, that leave by themselves after a few seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: ToastMessage) => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [...current, { ...message, id }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ol
        role="status"
        aria-live="polite"
        className="fixed right-4 bottom-4 left-4 z-50 grid gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </ol>
    </ToastContext.Provider>
  )
}
