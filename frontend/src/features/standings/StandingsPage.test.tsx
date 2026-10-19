import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club, StandingRow } from '../../api/types'
import { AppRoutes } from '../../app/AppRoutes'
import { fakeRoutes } from '../../test/fakeFetch'
import { AGUIAS_DELTA } from '../../test/fakeMatch'
import { renderWithProviders } from '../../test/renderWithProviders'

function row(position: number, clubId: number, name: string, changes: Partial<StandingRow>) {
  return {
    position,
    club_id: clubId,
    club_name: name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
    ...changes,
  }
}

/** The example of the statement (2.4.3): Delta FC first, Gama SC without matches, Águias FC last. */
const STANDINGS: StandingRow[] = [
  row(1, 2, 'Delta FC', {
    played: 1,
    wins: 1,
    goals_for: 2,
    goals_against: 1,
    goal_difference: 1,
    points: 3,
  }),
  row(2, 3, 'Gama SC', {}),
  row(3, 1, 'Águias FC', {
    played: 1,
    losses: 1,
    goals_for: 1,
    goals_against: 2,
    goal_difference: -1,
  }),
]

const CLUBS: Club[] = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 3, name: 'Gama SC', acronym: 'GAM', cash: 300, squad_value: 0, net_worth: 300 },
]

const { duels: _duels, ...LATEST } = AGUIAS_DELTA

function renderStandings(standings: StandingRow[] = STANDINGS) {
  fakeRoutes([
    { path: '/standings', body: standings },
    { path: '/clubs?sort=name', body: CLUBS },
    { path: '/matches', body: [LATEST] },
  ])
  renderWithProviders(<AppRoutes />, '/classificacao')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Classificação', () => {
  it('mostra os clubes na ordem da API com jogos, vitórias, empates, derrotas, gols, saldo e pontos', async () => {
    renderStandings()

    const table = await screen.findByRole('table', { name: 'Classificação' })
    await within(table).findByText('Delta FC')
    const rows = within(table).getAllByRole('row').slice(1)

    expect(rows.map((item) => within(item).getAllByRole('cell')[1].textContent)).toEqual([
      'DELDelta FC',
      'GAMGama SC',
      'AGUÁguias FC',
    ])
    expect(
      within(rows[0])
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1', 'DELDelta FC', '1', '1', '0', '0', '2', '1', '+1', '3'])
    expect(within(rows[2]).getAllByRole('cell')[8]).toHaveTextContent('-1')
    expect(within(rows[0]).getByRole('link', { name: 'Delta FC' })).toHaveAttribute(
      'href',
      '/clubes/2',
    )
  })

  it('mostra as últimas partidas e a ordem dos critérios', async () => {
    renderStandings()

    const recent = await screen.findByRole('link', { name: /Águias FC\s*1 × 2\s*Delta FC/ })

    expect(recent).toHaveAttribute('href', '/partidas/1')
    expect(screen.getByText('Maior saldo de gols')).toBeInTheDocument()
  })

  it('mostra a liga vazia', async () => {
    renderStandings([])
    expect(await screen.findByText('Nenhum clube na liga')).toBeInTheDocument()
  })

  it('mostra o erro quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderWithProviders(<AppRoutes />, '/classificacao')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível falar com a API')
  })
})
