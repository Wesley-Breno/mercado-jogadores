import { screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club, Purchase } from '../../api/types'
import { sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { BuyPlayer } from './BuyPlayer'

const EDUARDO = fakePlayer({
  id: 5,
  name: 'Eduardo Paiva',
  position: 'MEI',
  market_value: 46,
  club_id: null,
})

const CLUBS: Club[] = [
  { id: 4, name: 'Gama SC', acronym: 'GAM', cash: 181.84, squad_value: 0, net_worth: 181.84 },
  { id: 6, name: 'Tubarões EC', acronym: 'TUB', cash: 300, squad_value: 0, net_worth: 300 },
]

const PURCHASE: Purchase = {
  id: 10,
  club_id: 6,
  player_id: 5,
  player_name: 'Eduardo Paiva',
  type: 'COMPRA',
  value: 46,
  fee: 2.3,
  penalty: 0,
  profit: null,
  cash_change: -48.3,
  created_at: '2026-11-12T15:00:00-03:00',
  contract: { purchase_value: 46, loyalty_until: '2027-11-12T15:00:00-03:00', status: 'ATIVO' },
  club_cash: 251.7,
}

/** GET /clubs answers the clubs; the purchase answers `buy`, a moment later. */
function fakeApi(buy: { status: number; body: unknown }) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method !== 'POST') {
      return new Response(JSON.stringify(CLUBS), { status: 200 })
    }
    await new Promise((resolve) => setTimeout(resolve, 30))
    return new Response(JSON.stringify(buy.body), { status: buy.status })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function posts(fetchMock: ReturnType<typeof fakeApi>) {
  return fetchMock.mock.calls
    .map((_, index) => sentRequest(fetchMock, index))
    .filter((request) => request.method === 'POST')
}

async function fillForm(user: UserEvent, club: string, date: string, time: string) {
  const dialog = screen.getByRole('dialog', { name: 'Comprar jogador' })
  await user.selectOptions(
    within(dialog).getByLabelText('Clube comprador'),
    await within(dialog).findByRole('option', { name: new RegExp(club) }),
  )
  await user.type(within(dialog).getByLabelText('Data'), date)
  await user.type(within(dialog).getByLabelText('Hora'), time)
  return dialog
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BuyPlayer', () => {
  it('envia o clube e o fim da fidelidade com -03:00 e mostra o resultado da API', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi({ status: 200, body: PURCHASE })
    renderWithProviders(<BuyPlayer player={EDUARDO} onClose={vi.fn()} />)

    const dialog = await fillForm(user, 'Tubarões EC', '12112027', '1500')
    expect(within(dialog).getByLabelText('Data')).toHaveValue('12/11/2027')
    expect(within(dialog).getByLabelText('Hora')).toHaveValue('15:00')
    expect(within(dialog).getByText(/Caixa atual: 300,00/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar compra' }))

    const result = await screen.findByRole('dialog', { name: 'Compra concluída' })
    expect(posts(fetchMock)).toEqual([
      {
        method: 'POST',
        path: '/players/5/buy',
        body: { club_id: 6, loyalty_until: '2027-11-12T15:00-03:00' },
      },
    ])
    expect(within(result).getByText('Eduardo Paiva agora é do Tubarões EC.')).toBeInTheDocument()
    for (const value of ['46,00', '2,30', '48,30', '12/11/2027 15:00', 'ATIVO', '251,70']) {
      expect(within(result).getByText(value)).toBeInTheDocument()
    }
    expect(within(result).getByText('Novo caixa do Tubarões EC')).toBeInTheDocument()
    expect(within(result).getByRole('link', { name: 'Ver clube' })).toHaveAttribute(
      'href',
      '/clubes/6',
    )
  })

  it('valida clube, data e hora antes de enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi({ status: 200, body: PURCHASE })
    renderWithProviders(<BuyPlayer player={EDUARDO} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Comprar jogador' })

    await user.type(within(dialog).getByLabelText('Data'), '31022027')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar compra' }))

    expect(within(dialog).getByLabelText('Clube comprador')).toHaveAccessibleDescription(
      'Escolha o clube comprador.',
    )
    expect(within(dialog).getByLabelText('Data')).toHaveAccessibleDescription(
      'Use uma data do calendário, como 12/11/2027.',
    )
    expect(within(dialog).getByLabelText('Hora')).toHaveAccessibleDescription('Informe a hora.')
    expect(posts(fetchMock)).toEqual([])
  })

  it('mostra o message da API quando a compra é recusada', async () => {
    const user = userEvent.setup()
    fakeApi({
      status: 409,
      body: { message: 'O custo da compra (48,30) passa do limite de 50% do caixa (90,92).' },
    })
    renderWithProviders(<BuyPlayer player={EDUARDO} onClose={vi.fn()} />)

    const dialog = await fillForm(user, 'Gama SC', '12112027', '1500')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar compra' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O custo da compra (48,30) passa do limite de 50% do caixa (90,92).',
    )
  })

  it('envia um só pedido no clique duplo', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi({ status: 200, body: PURCHASE })
    renderWithProviders(<BuyPlayer player={EDUARDO} onClose={vi.fn()} />)

    const dialog = await fillForm(user, 'Tubarões EC', '12112027', '1500')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Confirmar compra' }))

    await screen.findByRole('dialog', { name: 'Compra concluída' })
    expect(posts(fetchMock)).toHaveLength(1)
  })
})
