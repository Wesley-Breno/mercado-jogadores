import { Clock, Swords, Trophy } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { Logo } from '../components/ui/Logo'
import { cn } from '../lib/cn'
import { CreateClub } from '../features/clubs/CreateClub'
import { useClubs } from '../features/clubs/queries'
import { useMatches } from '../features/matches/queries'
import { usePlayerTotal } from '../features/players/queries'
import { NAVIGATION } from './navigation'

function linkClasses(isActive: boolean): string {
  return cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium whitespace-nowrap',
    isActive
      ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
  )
}

/**
 * The main menu: sections with counters, the clubs (desktop only) and a summary of the
 * league with the last match. Counters and summary are optional extras; while they load or if the
 * API is down they are simply left out.
 */
export function Sidebar() {
  const players = usePlayerTotal()
  const clubs = useClubs()
  const matches = useMatches(undefined)
  const counts: Record<string, number | undefined> = {
    '/jogadores': players.data,
    '/clubes': clubs.data?.length,
    '/partidas': matches.data?.length,
  }
  const latest = matches.data?.[0]

  return (
    <aside className="flex flex-col border-b border-zinc-200 bg-zinc-50 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
      <div className="px-4 py-4 lg:px-5 lg:py-5">
        <Logo />
      </div>
      <div className="overflow-x-auto px-2 pb-2 lg:flex-1 lg:overflow-y-auto lg:px-3">
        <nav
          aria-label="Menu principal"
          className="grid grid-cols-2 gap-1 sm:flex lg:flex-col lg:gap-5"
        >
          {NAVIGATION.map((section) => (
            <div key={section.label} className="contents sm:flex sm:gap-1 lg:flex-col">
              <p className="hidden px-2 text-xs font-medium text-zinc-500 lg:block">
                {section.label}
              </p>
              {section.items.map(({ label, path, icon: Icon }) => (
                <NavLink key={path} to={path} className={({ isActive }) => linkClasses(isActive)}>
                  <Icon aria-hidden className="size-4" />
                  {label}{' '}
                  {counts[path] !== undefined && (
                    <span className="ml-auto pl-2 text-xs text-zinc-500 tabular-nums">
                      {counts[path]}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <section aria-label="Clubes da liga" className="mt-5 hidden lg:block">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-medium text-zinc-500">Clubes</h2>
            <CreateClub compact />
          </div>
          {clubs.data?.length === 0 && (
            <p className="px-2 py-1 text-xs text-zinc-500">Nenhum clube ainda.</p>
          )}
          <ul className="mt-1 grid gap-0.5">
            {clubs.data?.map((club) => (
              <li key={club.id}>
                <NavLink
                  to={`/clubes/${club.id}`}
                  className={({ isActive }) => linkClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-5 place-items-center rounded text-[0.625rem] font-semibold',
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-zinc-600 ring-1 ring-zinc-200',
                        )}
                      >
                        {club.name.charAt(0)}
                      </span>
                      <span className="truncate">{club.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="hidden px-3 pb-3 lg:block">
        <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-xs shadow-xs">
          {clubs.data && players.data !== undefined && (
            <p className="flex items-start gap-2">
              <Trophy aria-hidden className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <span>
                <span className="block text-sm font-medium text-zinc-950">Liga fictícia</span>
                <span className="text-zinc-500">
                  {clubs.data.length} {clubs.data.length === 1 ? 'clube' : 'clubes'} ·{' '}
                  {players.data} {players.data === 1 ? 'jogador' : 'jogadores'}
                </span>
              </span>
            </p>
          )}
          {latest && (
            <Link to={`/partidas/${latest.id}`} className="group flex items-start gap-2">
              <Swords aria-hidden className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <span>
                <span className="block text-sm font-medium text-zinc-950 group-hover:underline">
                  Última partida
                </span>
                <span className="text-zinc-500">
                  {latest.home.club_name} {latest.home.goals} × {latest.away.goals}{' '}
                  {latest.away.club_name}
                </span>
              </span>
            </Link>
          )}
          <p className="flex items-center gap-2 border-t border-zinc-200 pt-3 text-zinc-500">
            <Clock aria-hidden className="size-3.5" />
            Horário de Brasília (UTC−3)
          </p>
        </div>
      </div>
    </aside>
  )
}
