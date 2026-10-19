import { createContext, useContext, useEffect } from 'react'

export const BreadcrumbContext = createContext<(tail: string | undefined) => void>(() => undefined)

/** Adds the name of what the page shows to the breadcrumb ("Mercado › Clubes › Águias FC"). */
export function useBreadcrumbTail(tail: string | undefined): void {
  const setTail = useContext(BreadcrumbContext)
  useEffect(() => {
    setTail(tail)
    return () => setTail(undefined)
  }, [tail, setTail])
}
