import type { Club, Condition, PlayerQuery, PlayerSort, Position } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { CONDITION_LABELS, POSITION_LABELS } from './labels'

export const POSITIONS: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']
export const CONDITIONS: Condition[] = ['APTO', 'MAL_CONDICIONADO', 'DOENTE']
export const SORTS: PlayerSort[] = [
  'name',
  'value_desc',
  'value_asc',
  'age_desc',
  'age_asc',
  'position',
]
const PAGE_SIZE = 10
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_MAX_LENGTH = 100
export const AGE_RANGE = { min: 16, max: 45 }
export const VALUE_RANGE = { min: 0, max: 550 }

/** The tabs "Todos", "Livres" and "Em clubes", that is, the `free` filter. */
export type Availability = 'all' | 'free' | 'owned'

const FREE_FILTER: Record<Availability, boolean | undefined> = {
  all: undefined,
  free: true,
  owned: false,
}

const POSITIVE_INTEGER = /^[1-9][0-9]*$/
const TYPED_MONEY = /^(\d+)(?:[.,](\d{1,2}))?$/

export type ActiveFilter = {
  label: string
  clear: PlayerQuery
}

export function availabilityOf(query: PlayerQuery): Availability {
  if (query.free === undefined) {
    return 'all'
  }
  return query.free ? 'free' : 'owned'
}

export function freeFilter(availability: Availability): boolean | undefined {
  return FREE_FILTER[availability]
}

function positiveInteger(raw: string | null): number | undefined {
  return raw !== null && POSITIVE_INTEGER.test(raw) ? Number(raw) : undefined
}

function oneOf<T extends string>(raw: string | null, accepted: readonly T[]): T | undefined {
  return accepted.find((value) => value === raw)
}

function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/** Age typed or read from the address: a whole number from 16 to 45. */
export function parseAge(text: string): number | undefined {
  const age = positiveInteger(text.trim())
  return age !== undefined && age >= AGE_RANGE.min && age <= AGE_RANGE.max ? age : undefined
}

/** Amount typed as "10", "10,5" or "10.55", in the API format ("10.5"), from 0 to 550. */
export function parseMoney(text: string): string | undefined {
  const match = TYPED_MONEY.exec(text.trim())
  if (!match) {
    return undefined
  }
  const [, units, cents] = match
  const value = cents ? `${Number(units)}.${cents}` : String(Number(units))
  return Number(value) <= VALUE_RANGE.max ? value : undefined
}

function orderedRange<T extends number | string>(
  min: T | undefined,
  max: T | undefined,
): [T | undefined, T | undefined] {
  const inverted = min !== undefined && max !== undefined && Number(min) > Number(max)
  return inverted ? [undefined, undefined] : [min, max]
}

/** Filters kept in the address; anything the API would refuse is left out. */
export function readPlayerQuery(params: URLSearchParams): PlayerQuery {
  const free = params.get('free')
  const [minAge, maxAge] = orderedRange(
    parseAge(params.get('min_age') ?? ''),
    parseAge(params.get('max_age') ?? ''),
  )
  const [minValue, maxValue] = orderedRange(
    parseMoney(params.get('min_value') ?? ''),
    parseMoney(params.get('max_value') ?? ''),
  )
  return {
    search: params.get('search') ?? undefined,
    position: oneOf(params.get('position'), POSITIONS),
    condition: oneOf(params.get('condition'), CONDITIONS),
    free: free === null ? undefined : free === 'true',
    club_id: free === 'true' ? undefined : positiveInteger(params.get('club_id')),
    min_age: minAge,
    max_age: maxAge,
    min_value: minValue,
    max_value: maxValue,
    sort: oneOf(params.get('sort'), SORTS),
    page: positiveInteger(params.get('page')),
  }
}

/** Any change of filter or order goes back to the first page. */
export function changeQuery(query: PlayerQuery, changes: PlayerQuery): PlayerQuery {
  return { ...query, page: undefined, ...changes }
}

/** "Limpar filtros" keeps the tab and the order. */
export const CLEARED_FILTERS: PlayerQuery = {
  search: undefined,
  position: undefined,
  condition: undefined,
  club_id: undefined,
  min_age: undefined,
  max_age: undefined,
  min_value: undefined,
  max_value: undefined,
}

export function isSearchTooShort(search: string | undefined): boolean {
  const length = normalizeSpaces(search ?? '').length
  return length > 0 && length < SEARCH_MIN_LENGTH
}

/** What is sent to the API: one-letter searches wait, and order, page and limit are explicit. */
export function toRequest(query: PlayerQuery): PlayerQuery {
  const search = normalizeSpaces(query.search ?? '')
  return {
    ...query,
    search: search.length >= SEARCH_MIN_LENGTH ? search : undefined,
    sort: query.sort ?? 'name',
    page: query.page ?? 1,
    limit: PAGE_SIZE,
  }
}

/** Same filters with another tab, only to read `meta.total_items` for the tab counter. */
export function countRequest(request: PlayerQuery, availability: Availability): PlayerQuery {
  return { ...request, free: freeFilter(availability), page: 1, limit: 1 }
}

function rangeLabel(min: string | undefined, max: string | undefined): string | undefined {
  if (min !== undefined && max !== undefined) {
    return `${min} a ${max}`
  }
  if (min !== undefined) {
    return `a partir de ${min}`
  }
  return max === undefined ? undefined : `até ${max}`
}

export function ageLabel(query: PlayerQuery): string | undefined {
  return rangeLabel(query.min_age?.toString(), query.max_age?.toString())
}

export function valueLabel(query: PlayerQuery): string | undefined {
  const format = (value: string | undefined) =>
    value === undefined ? undefined : formatMoney(Number(value))
  return rangeLabel(format(query.min_value), format(query.max_value))
}

/** The chips of "Filtros ativos", each one with the change that removes it. */
export function activeFilters(
  query: PlayerQuery,
  clubs: ReadonlyMap<number, Club>,
): ActiveFilter[] {
  const search = normalizeSpaces(query.search ?? '')
  const ages = ageLabel(query)
  const values = valueLabel(query)
  const filters: Array<ActiveFilter | undefined> = [
    search ? { label: `Busca: ${search}`, clear: { search: undefined } } : undefined,
    query.position
      ? { label: `Posição: ${POSITION_LABELS[query.position]}`, clear: { position: undefined } }
      : undefined,
    query.condition
      ? {
          label: `Condição: ${CONDITION_LABELS[query.condition]}`,
          clear: { condition: undefined },
        }
      : undefined,
    query.club_id
      ? {
          label: `Clube: ${clubs.get(query.club_id)?.name ?? `nº ${query.club_id}`}`,
          clear: { club_id: undefined },
        }
      : undefined,
    ages
      ? { label: `Idade: ${ages}`, clear: { min_age: undefined, max_age: undefined } }
      : undefined,
    values
      ? {
          label: `Valor de mercado: ${values}`,
          clear: { min_value: undefined, max_value: undefined },
        }
      : undefined,
  ]
  return filters.filter((filter) => filter !== undefined)
}
