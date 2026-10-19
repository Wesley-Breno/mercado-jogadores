import { NavLink, Outlet } from 'react-router'

import { Logo } from '../components/ui/Logo'
import { cn } from '../lib/cn'
import { NAVIGATION } from './navigation'

export function AppLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-zinc-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4 lg:px-5 lg:py-6">
          <Logo />
        </div>
        <nav aria-label="Menu principal" className="overflow-x-auto px-2 pb-2 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {NAVIGATION.map(({ label, path, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                    )
                  }
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
