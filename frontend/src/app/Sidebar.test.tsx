import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club } from '../api/types'
import { fakeRoutes } from '../test/fakeFetch'
import { AGUIAS_DELTA } from '../test/fakeMatch'
import { renderWithProviders } from '../test/renderWithProviders'
import { Sidebar } from './Sidebar'

const CLUBS: Club[] = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
]

const { duels: _duels, ...LATEST } = AGUIAS_DELTA

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Sidebar', () => {
  it('mostra os contadores, os clubes e a última partida da API', async () => {
    fakeRoutes([
      {
        path: '/players?sort=name&page=1&limit=1',
        body: { data: [], meta: { page: 1, limit: 1, total_items: 23, total_pages: 23 } },
      },
      { path: '/clubs?sort=name', body: CLUBS },
      { path: '/matches', body: [LATEST] },
    ])
    renderWithProviders(<Sidebar />, '/clubes/2')

    const menu = screen.getByRole('navigation', { name: 'Menu principal' })
    expect(await within(menu).findByRole('link', { name: 'Jogadores 23' })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Clubes 2' })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Partidas 1' })).toBeInTheDocument()

    const clubs = screen.getByRole('region', { name: 'Clubes da liga' })
    expect(within(clubs).getByRole('link', { name: /Delta FC/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByText('2 clubes · 23 jogadores')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Última partida/ })).toHaveAttribute(
      'href',
      '/partidas/1',
    )
  })

  it('o botão + abre o formulário de novo clube', async () => {
    const user = userEvent.setup()
    fakeRoutes([{ path: '/clubs?sort=name', body: [] }])
    renderWithProviders(<Sidebar />, '/jogadores')

    expect(await screen.findByText('Nenhum clube ainda.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Adicionar clube' }))

    expect(screen.getByRole('dialog', { name: 'Novo clube' })).toBeInTheDocument()
  })
})
