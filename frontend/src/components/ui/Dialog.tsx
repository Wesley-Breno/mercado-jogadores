import { CircleCheck, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'

import { cn } from '../../lib/cn'
import { FOCUS_RING } from './buttonStyles'

type DialogProps = {
  title: string
  description?: ReactNode
  success?: boolean
  size?: 'md' | 'lg'
  placement?: 'center' | 'side'
  onClose: () => void
  footer: ReactNode
  children?: ReactNode
}

const FIRST_FIELD = 'input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

/**
 * Modal on the native <dialog>, open while it is rendered: the browser keeps the focus inside and
 * Escape asks to close. "side" opens it as a panel on the right, for details. A form starts on its first field; when the dialog leaves the screen, the
 * focus goes back to where it was.
 */
export function Dialog({
  title,
  description,
  success = false,
  size = 'md',
  placement = 'center',
  onClose,
  footer,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousFocus = document.activeElement
    dialogRef.current?.showModal()
    dialogRef.current?.querySelector<HTMLElement>(FIRST_FIELD)?.focus()
    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={cn(
        'overflow-hidden border-zinc-200 bg-white p-0 text-zinc-950 shadow-lg backdrop:bg-black/50',
        placement === 'side'
          ? 'my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-md border-l'
          : 'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-xl border',
        placement === 'center' && (size === 'md' ? 'max-w-md' : 'max-w-4xl'),
      )}
    >
      <div
        className={cn(
          'flex flex-col',
          placement === 'side' ? 'h-full' : 'max-h-[calc(100dvh-2rem)]',
        )}
      >
        <header className="relative px-5 pt-5 pb-4 sm:px-6">
          {success && (
            <span className="mb-3 grid size-9 place-items-center rounded-full bg-green-50 text-green-700">
              <CircleCheck aria-hidden className="size-5" />
            </span>
          )}
          <h2 id={titleId} className="pr-8 text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-zinc-500">
              {description}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className={cn(
              'absolute top-4 right-4 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950',
              FOCUS_RING,
            )}
          >
            <X aria-hidden className="size-4" />
          </button>
        </header>
        {children && <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>}
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 px-5 py-4 sm:px-6">
          {footer}
        </footer>
      </div>
    </dialog>
  )
}
