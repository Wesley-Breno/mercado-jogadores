import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { cn } from '../lib/cn'
import { BreadcrumbContext } from './breadcrumbContext'
import { breadcrumbFor } from './navigation'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const [tail, setTail] = useState<string>()
  const breadcrumb = [...breadcrumbFor(pathname), ...(tail ? [tail] : [])]

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <Sidebar />
      <div className="min-w-0 lg:p-2 lg:pl-0">
        <div className="min-h-screen bg-white lg:min-h-[calc(100vh-1rem)] lg:rounded-xl lg:border lg:border-zinc-200 lg:shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 lg:px-6">
            <ol
              aria-label="Você está em"
              className="flex items-center gap-1.5 text-sm text-zinc-500"
            >
              {breadcrumb.map((step, index) => (
                <li key={step} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                  <span className={cn(index === breadcrumb.length - 1 && 'text-zinc-950')}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries()}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
              aria-label="Recarregar os dados"
              title="Recarregar os dados"
            >
              <RefreshCw aria-hidden className="size-4" />
            </button>
          </header>
          <main className="px-4 py-6 lg:px-8 lg:py-7">
            <BreadcrumbContext.Provider value={setTail}>
              <Outlet />
            </BreadcrumbContext.Provider>
          </main>
        </div>
      </div>
    </div>
  )
}
