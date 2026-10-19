import { Coins, HeartPulse, Info, Search, Shield, Shirt, User, X } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Club, Condition, PlayerQuery, Position } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { type Choice, ChoiceMenu } from '../../components/ui/ChoiceMenu'
import { Input } from '../../components/ui/Field'
import { Popover } from '../../components/ui/Popover'
import { formatMoney } from '../../lib/format'
import { COMBINATION_NOTE, CONDITION_LABELS, POSITION_LABELS } from './labels'
import {
  type ActiveFilter,
  AGE_RANGE,
  CLEARED_FILTERS,
  CONDITIONS,
  POSITIONS,
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_LENGTH,
  VALUE_RANGE,
  ageLabel,
  isSearchTooShort,
  parseAge,
  parseMoney,
  valueLabel,
} from './playerQuery'
import { type Range, RangeFilter } from './RangeFilter'

type Change = (changes: PlayerQuery, options?: { replace: boolean }) => void

type PlayerFiltersProps = {
  query: PlayerQuery
  clubs: Club[]
  active: ActiveFilter[]
  onChange: Change
}

const POSITION_CHOICES: Choice<Position | undefined>[] = [
  { value: undefined, label: 'Todas as posições' },
  ...POSITIONS.map((position) => ({
    value: position,
    label: `${position} · ${POSITION_LABELS[position]}`,
  })),
]

const CONDITION_CHOICES: Choice<Condition | undefined>[] = [
  { value: undefined, label: 'Todas as condições' },
  ...CONDITIONS.map((condition) => ({ value: condition, label: CONDITION_LABELS[condition] })),
]

function withPrefix(prefix: string, value: string | undefined): string {
  return value === undefined ? prefix : `${prefix}: ${value}`
}

function toMoneyText(value: string | undefined): string | undefined {
  return value === undefined ? undefined : formatMoney(Number(value))
}

function toAgeRange({ min, max }: Range): PlayerQuery {
  return {
    min_age: min === undefined ? undefined : Number(min),
    max_age: max === undefined ? undefined : Number(max),
  }
}

/** Search, the five filter buttons and, below them, the active filters as removable chips. */
export function PlayerFilters({ query, clubs, active, onChange }: PlayerFiltersProps) {
  const isFreeOnly = query.free === true
  const clubChoices: Choice<number | undefined>[] = [
    { value: undefined, label: 'Todos os clubes' },
    ...clubs.map((club) => ({ value: club.id, label: club.name })),
  ]
  const selectedClub = clubs.find((club) => club.id === query.club_id)

  return (
    <div className="mb-5 grid gap-3">
      <Card className="flex flex-wrap gap-2 p-2">
        <label className="min-w-56 flex-1">
          <span className="sr-only">Buscar por nome</span>
          <Input
            type="search"
            icon={Search}
            placeholder="Buscar por nome"
            maxLength={SEARCH_MAX_LENGTH}
            value={query.search ?? ''}
            onChange={(event) => onChange({ search: event.target.value }, { replace: true })}
          />
        </label>
        <Popover
          icon={Shirt}
          label={withPrefix('Posição', query.position && POSITION_LABELS[query.position])}
          active={query.position !== undefined}
          popup="menu"
          panelLabel="Posição"
        >
          {(close) => (
            <ChoiceMenu
              title="Posição"
              choices={POSITION_CHOICES}
              selected={query.position}
              onSelect={(position) => {
                close()
                onChange({ position })
              }}
            />
          )}
        </Popover>
        <Popover
          icon={HeartPulse}
          label={withPrefix('Condição', query.condition && CONDITION_LABELS[query.condition])}
          active={query.condition !== undefined}
          popup="menu"
          panelLabel="Condição"
        >
          {(close) => (
            <ChoiceMenu
              title="Condição"
              choices={CONDITION_CHOICES}
              selected={query.condition}
              onSelect={(condition) => {
                close()
                onChange({ condition })
              }}
            />
          )}
        </Popover>
        <Popover
          icon={Shield}
          label={withPrefix('Clube', selectedClub?.name)}
          active={query.club_id !== undefined}
          disabled={isFreeOnly}
          popup="menu"
          panelLabel="Clube"
        >
          {(close) => (
            <ChoiceMenu
              title="Clube"
              choices={clubChoices}
              selected={query.club_id}
              onSelect={(clubId) => {
                close()
                onChange({ club_id: clubId })
              }}
            />
          )}
        </Popover>
        <Popover
          icon={User}
          label={withPrefix('Idade', ageLabel(query))}
          active={query.min_age !== undefined || query.max_age !== undefined}
          popup="dialog"
          panelLabel="Faixa de idade"
        >
          {(close) => (
            <RangeFilter
              initial={{ min: query.min_age?.toString(), max: query.max_age?.toString() }}
              hint={`Idade de ${AGE_RANGE.min} a ${AGE_RANGE.max} anos. Deixe um lado vazio para não limitar.`}
              invalidMessage={`Use uma idade de ${AGE_RANGE.min} a ${AGE_RANGE.max} anos.`}
              inputMode="numeric"
              parse={(text) => parseAge(text)?.toString()}
              onApply={(range) => {
                close()
                onChange(toAgeRange(range))
              }}
            />
          )}
        </Popover>
        <Popover
          icon={Coins}
          label={withPrefix(valueLabel(query) ? 'Valor' : 'Valor de mercado', valueLabel(query))}
          active={query.min_value !== undefined || query.max_value !== undefined}
          align="end"
          popup="dialog"
          panelLabel="Faixa de valor de mercado"
        >
          {(close) => (
            <RangeFilter
              initial={{ min: toMoneyText(query.min_value), max: toMoneyText(query.max_value) }}
              hint={`Valor de mercado de ${VALUE_RANGE.min} a ${VALUE_RANGE.max} moedas, com até 2 casas.`}
              invalidMessage={`Use um valor de ${VALUE_RANGE.min} a ${VALUE_RANGE.max}, como 10,50.`}
              inputMode="decimal"
              parse={parseMoney}
              onApply={({ min, max }) => {
                close()
                onChange({ min_value: min, max_value: max })
              }}
            />
          )}
        </Popover>
      </Card>
      {isSearchTooShort(query.search) && (
        <Note>Digite pelo menos {SEARCH_MIN_LENGTH} letras para buscar.</Note>
      )}
      {(isFreeOnly || query.club_id !== undefined) && <Note>{COMBINATION_NOTE}</Note>}
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-zinc-500">Filtros ativos:</span>
          {active.map((filter) => (
            <span
              key={filter.label}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-1 pr-1 pl-2 text-xs font-medium"
            >
              {filter.label}
              <button
                type="button"
                aria-label={`Remover o filtro ${filter.label}`}
                onClick={() => onChange(filter.clear)}
                className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange(CLEARED_FILTERS)}
            className="font-medium text-blue-600 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
      <Info aria-hidden className="size-3.5" />
      {children}
    </p>
  )
}
