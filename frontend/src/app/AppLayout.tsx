import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Clock, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { Logo } from '../components/ui/Logo'
import { cn } from '../lib/cn'
import { BreadcrumbContext } from './breadcrumbContext'
import { NAVIGATION, breadcrumbFor } from './navigation'

export function AppLayout() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const [tail, setTail] = useState<string>()
  const breadcrumb = [...breadcrumbFor(pathname), ...(tail ? [tail] : [])]

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col border-b border-zinc-200 bg-zinc-50 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="px-4 py-4 lg:px-5 lg:py-5">
          <Logo />
        </div>
        <nav aria-label="Menu principal" className="overflow-x-auto px-2 pb-2 lg:flex-1 lg:px-3">
          <div className="flex gap-1 lg:flex-col lg:gap-5">
            {NAVIGATION.map((section) => (
              <div key={section.label} className="flex gap-1 lg:flex-col">
                <p className="hidden px-2 text-xs font-medium text-zinc-500 lg:block">
                  {section.label}
                </p>
                {section.items.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium whitespace-nowrap',
                        isActive
                          ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
                      )
                    }
                  >
                    <Icon aria-hidden className="size-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </nav>
        <p className="hidden items-center gap-2 px-5 py-4 text-xs text-zinc-500 lg:flex">
          <Clock aria-hidden className="size-3.5" />
          Horário de Brasília (UTC−3)
        </p>
      </aside>
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
