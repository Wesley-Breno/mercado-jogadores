import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ClubDetail } from '../../api/types'
import { AppRoutes } from '../../app/AppRoutes'
import { respondWith, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'

const AGUIAS: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 261.15,
  squad_value: 1037,
  net_worth: 1298.15,
  players: [
    {
      ...fakePlayer({ id: 2, name: 'Meia Lua', position: 'MEI', market_value: 37, club_id: 1 }),
      contract: {
        purchase_value: 37,
        loyalty_until: '2029-11-04T17:10:00-03:00',
        remaining_days: 1089,
        penalty_rate: 20,
      },
    },
    {
      ...fakePlayer({ id: 5, name: 'Lucas Ferraz', condition: 'DOENTE', club_id: 1 }),
      contract: {
        purchase_value: 28.8,
        loyalty_until: '2026-11-07T09:00:00-03:00',
        remaining_days: 0,
        penalty_rate: 0,
      },
    },
  ],
}

function renderClub(path = '/clubes/1') {
  return renderWithProviders(<AppRoutes />, path)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ClubPage', () => {
  it('mostra caixa, valor do elenco e patrimônio devolvidos pela API', async () => {
    const fetchMock = respondWith(200, AGUIAS)
    renderClub()

    expect(await screen.findByRole('heading', { name: 'Águias FC' })).toBeInTheDocument()
    expect(screen.getByText('261,15')).toBeInTheDocument()
    expect(screen.getByText('1.037,00')).toBeInTheDocument()
    expect(screen.getByText('1.298,15')).toBeInTheDocument()
    expect(screen.getByText('2 de 12')).toBeInTheDocument()
    expect(sentRequest(fetchMock).path).toBe('/clubs/1')
    expect(screen.getByLabelText('Você está em')).toHaveTextContent('MercadoClubesÁguias FC')
  })

  it('mostra o elenco na ordem da API com as colunas do contrato', async () => {
    respondWith(200, AGUIAS)
    renderClub()

    await screen.findByRole('row', { name: /Meia Lua/ })
    const rows = screen.getAllByRole('row').slice(1)
    const meiaLua = rows[0]

    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'MLMeia Lua',
      'LFLucas Ferraz',
    ])
    expect(within(meiaLua).getByText('04/11/2029')).toBeInTheDocument()
    expect(within(meiaLua).getByText('17:10')).toBeInTheDocument()
    expect(within(meiaLua).getByText('1.089')).toBeInTheDocument()
    expect(within(meiaLua).getByText('20%')).toBeInTheDocument()
    expect(within(rows[1]).getByText('0%')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Doente')).toBeInTheDocument()
  })

  it('mostra o elenco vazio com o caminho para os jogadores livres', async () => {
    respondWith(200, { ...AGUIAS, squad_value: 0, net_worth: 261.15, players: [] })
    renderClub()

    expect(await screen.findByText('Nenhum jogador no elenco')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver jogadores livres' })).toHaveAttribute(
      'href',
      '/jogadores?free=true',
    )
  })

  it('avisa quando o clube não existe', async () => {
    respondWith(404, { message: 'Clube não encontrado.' })
    renderClub('/clubes/999')

    expect(await screen.findByText('Clube não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver clubes' })).toHaveAttribute('href', '/clubes')
  })

  it('mostra o erro e tenta de novo', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderClub()

    await screen.findByRole('alert')
    respondWith(200, AGUIAS)
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Águias FC' })).toBeInTheDocument()
  })
})
