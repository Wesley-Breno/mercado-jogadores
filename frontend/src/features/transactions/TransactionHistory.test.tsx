import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClubDetail, Transaction, TransactionHistory } from '../../api/types'
import { AppRoutes } from '../../app/AppRoutes'
import { fakeRoutes } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'

const CLUB: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 296.85,
  squad_value: 0,
  net_worth: 296.85,
  players: [],
}

const SALE: Transaction = {
  id: 11,
  club_id: 1,
  player_id: 2,
  player_name: 'Meia Lua',
  type: 'VENDA',
  value: 40,
  fee: 0.3,
  penalty: 4,
  profit: 3,
  cash_change: 35.7,
  created_at: '2026-11-05T16:40:00-03:00',
}

const PURCHASE: Transaction = {
  ...SALE,
  id: 10,
  type: 'COMPRA',
  value: 37,
  fee: 1.85,
  penalty: 0,
  profit: null,
  cash_change: -38.85,
  created_at: '2026-11-02T10:15:00-03:00',
}

const EVERYTHING: TransactionHistory = {
  data: [SALE, PURCHASE],
  summary: {
    total_spent: 38.85,
    total_received: 35.7,
    total_fees: 2.15,
    total_penalties: 4,
    total_profit: 3,
  },
}

const ONLY_SALES: TransactionHistory = {
  data: [SALE],
  summary: { ...EVERYTHING.summary, total_spent: 0, total_fees: 0.3 },
}

function fakeHistory(extra: Parameters<typeof fakeRoutes>[0] = []) {
  return fakeRoutes([
    ...extra,
    { path: '/clubs/1', body: CLUB },
    { path: '/clubs/1/transactions', body: EVERYTHING },
  ])
}

function historyUrls(fetchMock: ReturnType<typeof fakeRoutes>): string[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.pathname.endsWith('/transactions'))
    .map((url) => url.search)
}

const CSV = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n'

/** jsdom has no file downloads: the object URL and the link click are recorded instead. */
const downloads: string[] = []

beforeEach(() => {
  downloads.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:csv')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Histórico de transações', () => {
  it('abre pela aba e mostra as transações e os totais da API', async () => {
    const user = userEvent.setup()
    fakeHistory()
    renderWithProviders(<AppRoutes />, '/clubes/1')

    await user.click(await screen.findByRole('tab', { name: /Histórico/ }))

    const sale = await screen.findByRole('row', { name: /Venda/ })
    const purchase = screen.getByRole('row', { name: /Compra/ })
    expect(screen.getByRole('tab', { name: /Histórico/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(sale).getByText('05/11/2026')).toBeInTheDocument()
    expect(within(sale).getByText('16:40')).toBeInTheDocument()
    expect(within(sale).getByText('+3,00')).toBeInTheDocument()
    expect(within(sale).getByText('+35,70')).toBeInTheDocument()
    expect(within(purchase).getByText('-38,85')).toBeInTheDocument()
    expect(within(purchase).getByText('sem lucro')).toBeInTheDocument()
    const summary = screen.getByLabelText('Totais do histórico')
    for (const value of ['38,85', '35,70', '2,15', '4,00', '+3,00']) {
      expect(within(summary).getByText(value)).toBeInTheDocument()
    }
  })

  it('com as duas caixas marcadas, pede os dois tipos à API', async () => {
    const fetchMock = fakeHistory()
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico')

    await screen.findByRole('row', { name: /Compra/ })

    expect(screen.getByRole('checkbox', { name: 'Compra' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Venda' })).toBeChecked()
    expect(historyUrls(fetchMock)).toContain('?type=COMPRA,VENDA')
  })

  it('filtra por um tipo e mostra os totais desse filtro', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeHistory([{ path: '/clubs/1/transactions?type=VENDA', body: ONLY_SALES }])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico')
    await screen.findByRole('row', { name: /Compra/ })

    await user.click(screen.getByRole('checkbox', { name: 'Compra' }))

    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Compra/ })).not.toBeInTheDocument(),
    )
    expect(historyUrls(fetchMock)).toContain('?type=VENDA')
    expect(
      within(screen.getByLabelText('Totais do histórico')).getByText('0,30'),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Venda' })).toBeDisabled()
  })

  it('filtra por um jogador que aparece no histórico', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeHistory([
      { path: '/clubs/1/transactions?type=COMPRA,VENDA&player_id=2', body: EVERYTHING },
    ])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico')
    await screen.findByRole('row', { name: /Compra/ })

    await user.selectOptions(screen.getByLabelText('Jogador'), 'Meia Lua')

    await waitFor(() => expect(historyUrls(fetchMock)).toContain('?type=COMPRA,VENDA&player_id=2'))
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument()
  })

  it('mostra o message da API quando o filtro é recusado', async () => {
    fakeHistory([
      {
        path: '/clubs/1/transactions?type=COMPRA,VENDA&player_id=2',
        status: 404,
        body: { message: 'Jogador não encontrado.' },
      },
    ])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico&player_id=2')

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent('O filtro foi recusado')
    expect(alert).toHaveTextContent('Jogador não encontrado.')
    expect(screen.queryByLabelText('Totais do histórico')).not.toBeInTheDocument()
  })

  it('mostra o histórico vazio com os totais zerados', async () => {
    fakeRoutes([
      { path: '/clubs/1', body: CLUB },
      {
        path: '/clubs/1/transactions',
        body: {
          data: [],
          summary: {
            ...ONLY_SALES.summary,
            total_received: 0,
            total_fees: 0,
            total_penalties: 0,
            total_profit: 0,
          },
        },
      },
    ])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico')

    expect(await screen.findByText('Nenhuma transação')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Totais do histórico')).getAllByText('0,00')).toHaveLength(
      5,
    )
  })
})

describe('Exportar CSV', () => {
  it('baixa o arquivo da API pedido com os filtros aplicados', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeHistory([
      { path: '/clubs/1/transactions?type=VENDA', body: ONLY_SALES },
      { path: '/clubs/1/transactions/export?type=VENDA', text: CSV },
    ])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico&type=VENDA')
    await screen.findByRole('row', { name: /Venda/ })

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByText('CSV baixado')).toBeInTheDocument()
    expect(
      screen.getByText('transacoes-clube-1.csv, com o filtro de tipo Venda aplicado.'),
    ).toBeInTheDocument()
    expect(downloads).toEqual(['transacoes-clube-1.csv'])
    expect(
      fetchMock.mock.calls.map(([input]) => String(input)).filter((url) => url.includes('export')),
    ).toEqual(['http://localhost:8000/api/v1/clubs/1/transactions/export?type=VENDA'])
  })

  it('mostra o message da API quando a exportação é recusada', async () => {
    const user = userEvent.setup()
    fakeHistory([
      { path: '/clubs/1/transactions?type=COMPRA,VENDA&player_id=9', body: EVERYTHING },
      {
        path: '/clubs/1/transactions/export?type=COMPRA,VENDA&player_id=9',
        status: 404,
        body: { message: 'Jogador não encontrado.' },
      },
    ])
    renderWithProviders(<AppRoutes />, '/clubes/1?aba=historico&player_id=9')
    await screen.findByRole('row', { name: /Venda/ })

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador não encontrado.')
    expect(downloads).toEqual([])
  })
})
