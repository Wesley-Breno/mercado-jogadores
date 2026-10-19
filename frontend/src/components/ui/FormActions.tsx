import type { ReactNode } from 'react'

import { Alert } from './Alert'
import { Button } from './Button'

type FormActionsProps = {
  formId: string
  submitLabel: string
  isSubmitting: boolean
  error?: string
  note?: ReactNode
  onCancel: () => void
}

/**
 * Footer of every form dialog: the API `message` when it refuses, Cancel, and the submit button,
 * disabled while the request runs so that a double click sends a single request.
 */
export function FormActions({
  formId,
  submitLabel,
  isSubmitting,
  error,
  note,
  onCancel,
}: FormActionsProps) {
  return (
    <>
      {error && (
        <div className="basis-full">
          <Alert>{error}</Alert>
        </div>
      )}
      {note}
      <Button onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button variant="primary" type="submit" form={formId} disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : submitLabel}
      </Button>
    </>
  )
}
