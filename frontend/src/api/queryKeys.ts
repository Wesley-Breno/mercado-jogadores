import type { ClubSort, PlayerQuery, TransactionFilters } from './types'

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

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (clubId: string, filters: TransactionFilters) =>
    [...transactionKeys.all, clubId, filters] as const,
}

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (clubId: number | undefined) => [...matchKeys.lists(), clubId ?? 'all'] as const,
  detail: (id: string) => [...matchKeys.all, 'detail', id] as const,
}
