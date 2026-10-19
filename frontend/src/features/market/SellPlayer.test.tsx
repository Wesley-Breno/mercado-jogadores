import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Sale, SquadPlayer } from '../../api/types'
import { fakeRoutes, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SellPlayer } from './SellPlayer'

const FELIPE: SquadPlayer = {
  ...fakePlayer({ id: 7, name: 'Felipe Moura', market_value: 52, club_id: 1 }),
  contract: {
    purchase_value: 44.2,
    loyalty_until: '2027-04-04T15:45:00-03:00',
    remaining_days: 144,
    penalty_rate: 10,
  },
}

const SALE: Sale = {
  id: 11,
  club_id: 1,
  player_id: 7,
  player_name: 'Felipe Moura',
  type: 'VENDA',
  value: 52,
  fee: 0.78,
  penalty: 5.2,
  profit: 7.8,
  cash_change: 46.02,
  created_at: '2026-11-12T15:00:00-03:00',
  purchase_value: 44.2,
  remaining_days: 144,
  penalty_rate: 10,
  contract_status: 'RESCINDIDO',
  club_cash: 97.6,
}

const LINEUP_WITH_FELIPE = { club_id: 1, formation: '2-1-1', complete: true, players: [FELIPE] }
const NO_LINEUP = { club_id: 1, formation: null, complete: false, players: [] }

function renderSale() {
  const onClose = vi.fn()
  renderWithProviders(
    <SellPlayer player={FELIPE} clubName="Águias FC" onClose={onClose} onShowHistory={vi.fn()} />,
  )
  return screen.getByRole('dialog', { name: 'Vender Felipe Moura?' })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SellPlayer', () => {
  it('confirma com o contrato do elenco e avisa quando é titular', async () => {
    fakeRoutes([{ path: '/clubs/1/lineup', body: LINEUP_WITH_FELIPE }])
    const dialog = renderSale()

    expect(await within(dialog).findByText('Felipe Moura é titular')).toBeInTheDocument()
    for (const value of ['52,00', '44,20', '04/04/2027 15:45', '144', '10%']) {
      expect(within(dialog).getByText(value)).toBeInTheDocument()
    }
    expect(
      within(dialog).getByText('O jogador sai do elenco do Águias FC e volta a ficar livre.'),
    ).toBeInTheDocument()
  })

  it('vende sem corpo e mostra todos os valores devolvidos pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeRoutes([
      { path: '/clubs/1/lineup', body: LINEUP_WITH_FELIPE },
      { method: 'POST', path: '/players/7/sell', body: SALE },
    ])
    const dialog = renderSale()
    await within(dialog).findByText('Felipe Moura é titular')

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }))

    const result = await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(sentRequest(fetchMock, 1)).toEqual({
      method: 'POST',
      path: '/players/7/sell',
      body: undefined,
    })
    expect(
      within(result).getByText('Felipe Moura voltou a ficar livre e saiu da escalação.'),
    ).toBeInTheDocument()
    for (const value of ['44,20', '52,00', '144', '5,20', '+7,80', '0,78', '+46,02', '97,60']) {
      expect(within(result).getByText(value)).toBeInTheDocument()
    }
    expect(within(result).getByText('RESCINDIDO')).toBeInTheDocument()
    expect(within(result).getByText('10% do valor de venda, com teto de 10,00')).toBeInTheDocument()
    expect(within(result).getByText('Novo caixa do Águias FC')).toBeInTheDocument()
  })

  it('explica a venda sem multa e com prejuízo', async () => {
    const user = userEvent.setup()
    fakeRoutes([
      { path: '/clubs/1/lineup', body: NO_LINEUP },
      {
        method: 'POST',
        path: '/players/7/sell',
        body: {
          ...SALE,
          value: 24,
          penalty: 0,
          penalty_rate: 0,
          remaining_days: 0,
          profit: -4.8,
          fee: 0,
          cash_change: 24,
          contract_status: 'ENCERRADO',
        },
      },
    ])
    const dialog = renderSale()

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }))

    const result = await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(
      within(result).getByText(
        'Felipe Moura voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.',
      ),
    ).toBeInTheDocument()
    expect(within(result).getByText('-4,80')).toBeInTheDocument()
    expect(within(result).getByText('Sem lucro: sem comissão')).toBeInTheDocument()
    expect(within(result).getByText('ENCERRADO')).toBeInTheDocument()
  })

  it('mostra o message da API quando a venda é recusada', async () => {
    const user = userEvent.setup()
    fakeRoutes([
      { path: '/clubs/1/lineup', body: NO_LINEUP },
      {
        method: 'POST',
        path: '/players/7/sell',
        status: 409,
        body: { message: 'O jogador está livre e não pode ser vendido.' },
      },
    ])
    const dialog = renderSale()

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O jogador está livre e não pode ser vendido.',
    )
  })

  it('envia um só pedido no clique duplo', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeRoutes([
      { path: '/clubs/1/lineup', body: NO_LINEUP },
      { method: 'POST', path: '/players/7/sell', body: SALE },
    ])
    const dialog = renderSale()

    await user.dblClick(within(dialog).getByRole('button', { name: 'Confirmar venda' }))

    await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  })
})
