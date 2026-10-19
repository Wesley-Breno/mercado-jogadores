import { createContext, useContext } from 'react'

export type ToastMessage = {
  title: string
  description: string
}

export const ToastContext = createContext<((message: ToastMessage) => void) | null>(null)

/** Shows a success notice in the corner of the screen. */
export function useToast(): (message: ToastMessage) => void {
  const show = useContext(ToastContext)
  if (!show) {
    throw new Error('useToast precisa estar dentro do ToastProvider.')
  }
  return show
}
