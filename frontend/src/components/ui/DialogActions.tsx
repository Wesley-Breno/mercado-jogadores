import type { ReactNode } from 'react'

import { Alert } from './Alert'
import { Button } from './Button'

type DialogActionsProps = {
  confirmLabel: string
  pendingLabel?: string
  isPending: boolean
  error?: string
  note?: ReactNode
  destructive?: boolean
  onCancel: () => void
} & ({ formId: string } | { onConfirm: () => void })

/**
 * Footer of every action dialog: the API `message` when it refuses, Cancel, and the button that
 * submits the form (or confirms), disabled while the request runs so a double click sends one
 * request.
 */
export function DialogActions({
  confirmLabel,
  pendingLabel = 'Salvando…',
  isPending,
  error,
  note,
  destructive = false,
  onCancel,
  ...action
}: DialogActionsProps) {
  return (
    <>
      {error && (
        <div className="basis-full">
          <Alert>{error}</Alert>
        </div>
      )}
      {note}
      <Button onClick={onCancel} disabled={isPending}>
        Cancelar
      </Button>
      <Button
        variant={destructive ? 'destructive' : 'primary'}
        disabled={isPending}
        {...('formId' in action
          ? { type: 'submit', form: action.formId }
          : { onClick: action.onConfirm })}
      >
        {isPending ? pendingLabel : confirmLabel}
      </Button>
    </>
  )
}
