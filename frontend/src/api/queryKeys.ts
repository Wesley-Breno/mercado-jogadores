import type { ClubSort, PlayerQuery } from './types'

/** Cache keys of every resource, in one place so that each action knows what to fetch again. */
export const playerKeys = {
  all: ['players'] as const,
  list: (query: PlayerQuery) => [...playerKeys.all, 'list', query] as const,
}

export const clubKeys = {
  all: ['clubs'] as const,
  list: (sort: ClubSort) => [...clubKeys.all, 'list', sort] as const,
  detail: (id: string) => [...clubKeys.all, 'detail', id] as const,
}

export const lineupKeys = {
  all: ['lineups'] as const,
  detail: (clubId: string) => [...lineupKeys.all, clubId] as const,
}
