import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club, Player } from '../../api/types'
import { renderWithProviders } from '../../test/renderWithProviders'
import { PlayersPage } from './PlayersPage'

const CLUBS: Club[] = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 210.5, squad_value: 89.5, net_worth: 300 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
]

function player(id: number, changes: Partial<Player> = {}): Player {
  return {
    id,
    name: `Jogador Número ${id}`,
    position: 'MEI',
    agility: 70,
    age: 25,
    condition: 'APTO',
    base_value: 30,
    market_value: 30,
    pace: 70,
    shooting: 70,
    passing: 70,
    dribbling: 70,
    defending: 70,
    physical: 70,
    potential: 70,
    overall: 70,
    club_id: id % 3 === 0 ? null : 1,
    ...changes,
  }
}

const PLAYERS: Player[] = [
  player(1, {
    name: 'André Lacerda',
    position: 'GOL',
    agility: 70,
    age: 31,
    base_value: 26,
    market_value: 26,
    overall: 68,
    club_id: 2,
  }),
  player(2, {
    name: 'Danilo Freitas',
    position: 'ZAG',
    condition: 'MAL_CONDICIONADO',
    base_value: 36,
    market_value: 27,
    club_id: null,
  }),
  ...Array.from({ length: 21 }, (_, index) => player(index + 3)),
]

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

/** Answers like the API: `free` and `club_id` filter, `page` and `limit` slice, DELETE removes. */
function fakeApi(initial: Player[] = PLAYERS) {
  let players = initial
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/clubs')) {
      return json(CLUBS)
    }
    if (init?.method === 'DELETE') {
      const id = Number(url.pathname.split('/').pop())
      players = players.filter((item) => item.id !== id)
      return new Response(null, { status: 204 })
    }
    const free = url.searchParams.get('free')
    const clubId = url.searchParams.get('club_id')
    const found = players.filter(
      (item) =>
        (free === null || (item.club_id === null) === (free === 'true')) &&
        (clubId === null || item.club_id === Number(clubId)),
    )
    const page = Number(url.searchParams.get('page'))
    const limit = Number(url.searchParams.get('limit'))
    return json({
      data: found.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total_items: found.length,
        total_pages: Math.ceil(found.length / limit),
      },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Query of the last list request (the tab counters ask for limit=1 and are left out). */
function lastListQuery(fetchMock: ReturnType<typeof fakeApi>): URLSearchParams {
  const lists = fetchMock.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.pathname.endsWith('/players') && url.searchParams.get('limit') === '10')
  return lists[lists.length - 1].searchParams
}

function renderPage(path = '/jogadores') {
  return renderWithProviders(<PlayersPage />, path)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PlayersPage', () => {
  it('mostra os jogadores com os valores da API, o clube e o total', async () => {
    const fetchMock = fakeApi()
    renderPage()

    const andre = await screen.findByRole('row', { name: /André Lacerda/ })
    const danilo = screen.getByRole('row', { name: /Danilo Freitas/ })

    expect(within(andre).getByText('GOL')).toBeInTheDocument()
    expect(within(andre).getByText('68')).toBeInTheDocument()
    expect(within(andre).getAllByText('26,00')).toHaveLength(2)
    expect(within(andre).getByText('Apto')).toBeInTheDocument()
    expect(await within(andre).findByText('Delta FC')).toBeInTheDocument()
    expect(within(danilo).getByText('Mal condicionado')).toBeInTheDocument()
    expect(within(danilo).getByText('Livre')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–10 de 23 jogadores')).toBeInTheDocument()
    expect(Object.fromEntries(lastListQuery(fetchMock))).toEqual({
      sort: 'name',
      page: '1',
      limit: '10',
    })
  })

  it('navega entre as páginas', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(await screen.findByText('Mostrando 11–20 de 23 jogadores')).toBeInTheDocument()
    expect(lastListQuery(fetchMock).get('page')).toBe('2')
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('a aba Livres envia free=true e desabilita o filtro por clube', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: /^Livres/ }))

    await waitFor(() => expect(lastListQuery(fetchMock).get('free')).toBe('true'))
    expect(screen.getByRole('button', { name: 'Clube' })).toBeDisabled()
    expect(screen.getByText('“Livres” não combina com o filtro por clube.')).toBeInTheDocument()
  })

  it('o filtro por clube desabilita a aba Livres', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Clube' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Águias FC' }))

    await waitFor(() => expect(lastListQuery(fetchMock).get('club_id')).toBe('1'))
    expect(screen.getByRole('button', { name: /^Livres/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clube: Águias FC' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remover o filtro Clube: Águias FC' }),
    ).toBeInTheDocument()
  })

  it('ordena pela opção escolhida', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Ordenar: nome' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Maior idade' }))

    await waitFor(() => expect(lastListQuery(fetchMock).get('sort')).toBe('age_desc'))
    expect(screen.getByRole('button', { name: 'Ordenar: maior idade' })).toBeInTheDocument()
  })

  it('valida a faixa de idade antes de filtrar', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Idade' }))
    const dialog = screen.getByRole('dialog', { name: 'Faixa de idade' })
    await user.type(within(dialog).getByLabelText('De'), '30')
    await user.type(within(dialog).getByLabelText('Até'), '18')
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar filtro' }))

    expect(within(dialog).getByText('Use um valor maior ou igual ao “De”.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('De'))
    await user.type(within(dialog).getByLabelText('De'), '15')
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar filtro' }))

    expect(within(dialog).getByText('Use uma idade de 16 a 45 anos.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('De'))
    await user.type(within(dialog).getByLabelText('De'), '16')
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar filtro' }))

    await waitFor(() => expect(lastListQuery(fetchMock).get('min_age')).toBe('16'))
    expect(lastListQuery(fetchMock).get('max_age')).toBe('18')
    expect(screen.getByRole('button', { name: 'Idade: 16 a 18' })).toBeInTheDocument()
  })

  it('só busca a partir de 2 letras', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome' }), 'd')

    expect(screen.getByText('Digite pelo menos 2 letras para buscar.')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome' }), 'a')

    await waitFor(() => expect(lastListQuery(fetchMock).get('search')).toBe('da'))
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('search=d&'))).toBe(false)
  })

  it('remove um filtro pelo chip', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderPage('/jogadores?condition=DOENTE&position=GOL')
    await screen.findByText('Filtros ativos:')

    await user.click(screen.getByRole('button', { name: 'Remover o filtro Condição: Doente' }))

    await waitFor(() => expect(lastListQuery(fetchMock).get('condition')).toBeNull())
    expect(lastListQuery(fetchMock).get('position')).toBe('GOL')
  })

  it('abre a edição e a condição pelo menu da linha', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Ações de André Lacerda' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))

    expect(screen.getByRole('dialog', { name: 'Editar jogador' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('André Lacerda')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Ações de Danilo Freitas' }))
    await user.click(screen.getByRole('menuitem', { name: 'Alterar condição' }))

    expect(screen.getByRole('dialog', { name: 'Alterar condição física' })).toBeInTheDocument()
  })

  it('exclui um jogador livre, que sai da lista', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Ações de Danilo Freitas' }))
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }))
    await user.click(screen.getByRole('button', { name: 'Excluir jogador' }))

    expect(await screen.findByText('Jogador excluído')).toBeInTheDocument()
    expect(await screen.findByText('Mostrando 1–10 de 22 jogadores')).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Danilo Freitas/ })).not.toBeInTheDocument()
  })

  it('abre a compra pelo botão Comprar do jogador livre', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Comprar Danilo Freitas' }))

    expect(screen.getByRole('dialog', { name: 'Comprar jogador' })).toHaveTextContent(
      'Danilo Freitas',
    )
    expect(screen.queryByRole('button', { name: 'Comprar André Lacerda' })).not.toBeInTheDocument()
  })

  it('só oferece a exclusão de jogador livre', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderPage()
    await screen.findByText('Mostrando 1–10 de 23 jogadores')

    await user.click(screen.getByRole('button', { name: 'Ações de André Lacerda' }))

    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeDisabled()
    expect(screen.getByText('Só jogador livre pode ser excluído.')).toBeInTheDocument()
  })

  it('mostra a lista vazia', async () => {
    fakeApi([])
    renderPage()

    expect(await screen.findByText('Nenhum jogador cadastrado')).toBeInTheDocument()
  })

  it('mostra o erro quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderPage()

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent('Não foi possível falar com a API')
    expect(within(alert).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})
