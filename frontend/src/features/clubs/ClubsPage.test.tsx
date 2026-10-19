import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club } from '../../api/types'
import { sentRequest } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ClubsPage } from './ClubsPage'

const CLUBS: Club[] = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 51.58, squad_value: 222.68, net_worth: 274.26 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 91.85, squad_value: 200.76, net_worth: 292.61 },
]

/** GET /clubs answers the list (reversed for net worth); POST answers `created` or a refusal. */
function fakeApi(clubs: Club[] = CLUBS, post: { status: number; body: unknown } | null = null) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'POST' && post) {
      return new Response(JSON.stringify(post.body), { status: post.status })
    }
    const sort = new URL(String(input)).searchParams.get('sort')
    const body = sort === 'net_worth_desc' ? [...clubs].reverse() : clubs
    return new Response(JSON.stringify(body), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function clubNames(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

async function openForm(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Novo clube' }))
  return screen.getByRole('dialog', { name: 'Novo clube' })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ClubsPage', () => {
  it('mostra os clubes com os valores da API, pedindo a ordem por nome', async () => {
    const fetchMock = fakeApi()
    renderWithProviders(<ClubsPage />, '/clubes')

    const aguias = await screen.findByRole('row', { name: /Águias FC/ })

    expect(within(aguias).getByText('51,58')).toBeInTheDocument()
    expect(within(aguias).getByText('222,68')).toBeInTheDocument()
    expect(within(aguias).getByText('274,26')).toBeInTheDocument()
    expect(screen.getByText('2 de 20')).toBeInTheDocument()
    expect(sentRequest(fetchMock).path).toBe('/clubs')
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\?sort=name$/)
  })

  it('ordena pelo patrimônio na ordem devolvida pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderWithProviders(<ClubsPage />, '/clubes')
    await screen.findByRole('row', { name: /Águias FC/ })

    await user.click(screen.getByRole('button', { name: 'Ordenar: nome' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Patrimônio (maior para o menor)' }))

    await waitFor(() => expect(clubNames()).toEqual(['DELDelta FC', 'AGUÁguias FC']))
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toMatch(/\?sort=net_worth_desc$/)
  })

  it('mostra a lista vazia com o botão de criar', async () => {
    fakeApi([])
    renderWithProviders(<ClubsPage />, '/clubes')

    expect(await screen.findByText('Nenhum clube cadastrado')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Novo clube' })).toHaveLength(2)
  })

  it('mostra o erro quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderWithProviders(<ClubsPage />, '/clubes')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível falar com a API')
  })
})

describe('Novo clube', () => {
  it('valida nome e sigla antes de enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeApi()
    renderWithProviders(<ClubsPage />, '/clubes')
    const dialog = await openForm(user)

    await user.type(within(dialog).getByLabelText('Nome'), 'Ab')
    await user.type(within(dialog).getByLabelText('Sigla'), 'L1')
    await user.click(within(dialog).getByRole('button', { name: 'Criar clube' }))

    expect(within(dialog).getByLabelText('Nome')).toHaveAccessibleDescription(
      'Use de 3 a 60 caracteres.',
    )
    expect(within(dialog).getByLabelText('Sigla')).toHaveAccessibleDescription('Use 3 letras.')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('cria o clube com a sigla em maiúsculas e avisa o caixa inicial', async () => {
    const user = userEvent.setup()
    const created = {
      id: 3,
      name: 'Leões da Serra',
      acronym: 'LDS',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    }
    const fetchMock = fakeApi(CLUBS, { status: 201, body: created })
    renderWithProviders(<ClubsPage />, '/clubes')
    const dialog = await openForm(user)

    await user.type(within(dialog).getByLabelText('Nome'), '  Leões   da Serra ')
    await user.type(within(dialog).getByLabelText('Sigla'), 'lds')
    await user.click(within(dialog).getByRole('button', { name: 'Criar clube' }))

    expect(await screen.findByText('Clube criado')).toBeInTheDocument()
    expect(screen.getByText('Leões da Serra (LDS) começa com 300,00 em caixa.')).toBeInTheDocument()
    const post = fetchMock.mock.calls.findIndex(([, init]) => init?.method === 'POST')
    expect(sentRequest(fetchMock, post).body).toEqual({ name: 'Leões da Serra', acronym: 'LDS' })
  })

  it('mostra o message da API quando o clube é recusado', async () => {
    const user = userEvent.setup()
    fakeApi(CLUBS, { status: 409, body: { message: 'Já existe um clube com o nome "Águias FC".' } })
    renderWithProviders(<ClubsPage />, '/clubes')
    const dialog = await openForm(user)

    await user.type(within(dialog).getByLabelText('Nome'), 'águias fc')
    await user.type(within(dialog).getByLabelText('Sigla'), 'AGF')
    await user.click(within(dialog).getByRole('button', { name: 'Criar clube' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Já existe um clube com o nome "Águias FC".',
    )
  })
})
