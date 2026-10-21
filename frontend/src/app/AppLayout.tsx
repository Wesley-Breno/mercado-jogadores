import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { type MouseEvent, Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { cn } from '../lib/cn'
import { BreadcrumbContext } from './breadcrumbContext'
import { breadcrumbFor, pageTitle } from './navigation'
import { Sidebar } from './Sidebar'

/** While the code of a screen downloads, the menu and the header stay, and only the content waits. */
function ScreenLoading() {
  return (
    <>
      <p role="status" className="sr-only">
        Carregando a tela…
      </p>
      <span className="block h-64 animate-pulse rounded-xl bg-zinc-100" />
    </>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const [tail, setTail] = useState<string>()
  const breadcrumb = [...breadcrumbFor(pathname), ...(tail ? [tail] : [])]
  const title = pageTitle(breadcrumb)
  const mainRef = useRef<HTMLElement>(null)
  const firstPath = useRef(pathname)

  useEffect(() => {
    document.title = title
  }, [title])

  // A new screen does not reload the page, so the focus goes to its content, as after a page load.
  useEffect(() => {
    if (pathname !== firstPath.current) {
      firstPath.current = pathname
      mainRef.current?.focus()
    }
  }, [pathname])

  function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    mainRef.current?.focus()
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <a
        href="#conteudo"
        onClick={skipToContent}
        className="sr-only rounded-lg bg-white text-sm font-medium text-blue-700 shadow-md ring-2 ring-blue-600 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:outline-none"
      >
        Pular para o conteúdo
      </a>
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
          <main
            ref={mainRef}
            id="conteudo"
            tabIndex={-1}
            className="px-4 py-6 focus:outline-none lg:px-8 lg:py-7"
          >
            <BreadcrumbContext.Provider value={setTail}>
              <Suspense fallback={<ScreenLoading />}>
                <Outlet />
              </Suspense>
            </BreadcrumbContext.Provider>
          </main>
        </div>
      </div>
    </div>
  )
}
