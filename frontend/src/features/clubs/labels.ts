import type { ClubSort } from '../../api/types'

/** RN10: the league takes at most 20 clubs (the API refuses the 21st with 409). */
export const MAX_CLUBS = 20

/** RN14: a squad has at most 12 players. */
export const MAX_SQUAD = 12

export const CLUB_SORTS: ClubSort[] = ['name', 'net_worth_desc', 'net_worth_asc']

export const CLUB_SORT_LABELS: Record<ClubSort, string> = {
  name: 'Nome',
  net_worth_desc: 'Patrimônio (maior para o menor)',
  net_worth_asc: 'Patrimônio (menor para o maior)',
}
