import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Club } from '../../api/types'
import { AppRoutes } from '../../app/AppRoutes'
import { fakeRoutes, sentRequest } from '../../test/fakeFetch'
import { AGUIAS_DELTA } from '../../test/fakeMatch'
import { renderWithProviders } from '../../test/renderWithProviders'

const CLUBS: Club[] = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 3, name: 'Gama SC', acronym: 'GAM', cash: 300, squad_value: 0, net_worth: 300 },
]

const { duels: _duels, ...SUMMARY } = AGUIAS_DELTA

function fakeLeague(extra: Parameters<typeof fakeRoutes>[0] = [], matches = [SUMMARY]) {
  return fakeRoutes([
    ...extra,
    { path: '/clubs?sort=name', body: CLUBS },
    { path: '/matches', body: matches },
  ])
}

function posts(fetchMock: ReturnType<typeof fakeRoutes>) {
  return fetchMock.mock.calls
    .map((_, index) => sentRequest(fetchMock, index))
    .filter((request) => request.method === 'POST')
}

async function playBetween(user: UserEvent, home: string, away: string) {
  await user.click(screen.getByRole('button', { name: 'Nova partida' }))
  const dialog = screen.getByRole('dialog', { name: 'Nova partida' })
  await within(dialog).findAllByRole('option', { name: /Águias FC/ })
  await user.selectOptions(within(dialog).getByLabelText('Mandante'), home)
  await user.selectOptions(within(dialog).getByLabelText('Visitante'), away)
  return dialog
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Histórico de partidas', () => {
  it('mostra as partidas da API com a última em destaque', async () => {
    fakeLeague()
    renderWithProviders(<AppRoutes />, '/partidas')

    const row = await screen.findByRole('row', { name: /Águias FC/ })

    expect(within(row).getByText('12/11/2026')).toBeInTheDocument()
    expect(within(row).getByText('1 × 2')).toBeInTheDocument()
    expect(within(row).getByText('Vitória do visitante')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: /Ver duelos/ })).toHaveAttribute(
      'href',
      '/partidas/1',
    )
    expect(screen.getByRole('region', { name: 'Última partida' })).toHaveTextContent('1 × 2')
    expect(screen.getByText('1 partida')).toBeInTheDocument()
  })

  it('filtra por clube', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeLeague([{ path: '/matches?club_id=3', body: [] }])
    renderWithProviders(<AppRoutes />, '/partidas')
    await screen.findByRole('row', { name: /Águias FC/ })

    await user.selectOptions(screen.getByLabelText('Clube'), 'Gama SC')

    expect(
      await screen.findByText('Esse clube ainda não jogou nenhuma partida.'),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toContain(
      'http://localhost:8000/api/v1/matches?club_id=3',
    )
  })

  it('mostra a lista vazia e o erro', async () => {
    fakeLeague([], [])
    const { unmount } = renderWithProviders(<AppRoutes />, '/partidas')

    expect(await screen.findByText('Nenhuma partida jogada')).toBeInTheDocument()
    unmount()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderWithProviders(<AppRoutes />, '/partidas')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível falar com a API')
  })
})

describe('Nova partida', () => {
  it('joga a partida e abre os duelos devolvidos pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeLeague([
      { method: 'POST', path: '/matches', status: 201, body: AGUIAS_DELTA },
    ])
    renderWithProviders(<AppRoutes />, '/partidas')

    const dialog = await playBetween(user, 'Águias FC (AGU)', 'Delta FC (DEL)')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Jogar partida' }))

    expect(await screen.findByText('Partida jogada')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Águias FC 1 × 2 Delta FC' }),
    ).toBeInTheDocument()
    expect(posts(fetchMock)).toEqual([
      { method: 'POST', path: '/matches', body: { home_club_id: 1, away_club_id: 2 } },
    ])
    expect(screen.getAllByRole('row')).toHaveLength(8)
  })

  it('valida os dois clubes antes de enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeLeague()
    renderWithProviders(<AppRoutes />, '/partidas')

    const dialog = await playBetween(user, 'Águias FC (AGU)', 'Águias FC (AGU)')
    await user.click(within(dialog).getByRole('button', { name: 'Jogar partida' }))

    expect(within(dialog).getByLabelText('Visitante')).toHaveAccessibleDescription(
      'Escolha um clube diferente do mandante.',
    )
    expect(posts(fetchMock)).toEqual([])
  })

  it('mostra o message da API quando um clube não tem escalação completa', async () => {
    const user = userEvent.setup()
    fakeLeague([
      {
        method: 'POST',
        path: '/matches',
        status: 409,
        body: { message: 'Escalação incompleta: o Gama SC não tem os 5 titulares.' },
      },
    ])
    renderWithProviders(<AppRoutes />, '/partidas')

    const dialog = await playBetween(user, 'Gama SC (GAM)', 'Águias FC (AGU)')
    await user.click(within(dialog).getByRole('button', { name: 'Jogar partida' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Escalação incompleta: o Gama SC não tem os 5 titulares.',
    )
  })
})

describe('Partida', () => {
  it('mostra o placar e os 6 duelos, separados pelo clube que ataca', async () => {
    fakeRoutes([{ path: '/matches/1', body: AGUIAS_DELTA }])
    renderWithProviders(<AppRoutes />, '/partidas/1')

    const home = await screen.findByRole('region', { name: 'Ataques do Águias FC' })
    const away = screen.getByRole('region', { name: 'Ataques do Delta FC' })

    expect(within(home).getAllByRole('row')).toHaveLength(4)
    expect(within(away).getAllByRole('row')).toHaveLength(4)
    const first = within(home).getByRole('row', { name: /Otto Rangel/ })
    expect(within(first).getByText('Finalização')).toBeInTheDocument()
    expect(within(first).getByText('75')).toBeInTheDocument()
    expect(within(first).getByText('Gol')).toBeInTheDocument()
    expect(within(home).getByText('LAT · Mal condicionado')).toBeInTheDocument()
    expect(screen.getByLabelText('Você está em')).toHaveTextContent('Águias FC 1 × 2 Delta FC')
  })

  it('desenha em campo os titulares dos dois clubes com os valores gravados nos duelos', async () => {
    fakeRoutes([{ path: '/matches/1', body: AGUIAS_DELTA }])
    renderWithProviders(<AppRoutes />, '/partidas/1')

    const home = await screen.findByRole('region', {
      name: 'Titulares do Águias FC, mandante, no 2-1-1',
    })
    const away = screen.getByRole('region', { name: 'Titulares do Delta FC, visitante, no 2-1-1' })

    expect(within(home).getAllByRole('listitem')).toHaveLength(5)
    expect(within(away).getAllByRole('listitem')).toHaveLength(5)
    expect(within(home).getByText('Rui Prado, GOL: defesa 77')).toBeInTheDocument()
    expect(
      within(home).getByText('Davi Lins, LAT, 2º de linha, mal condicionado: drible 63, defesa 56'),
    ).toBeInTheDocument()
    expect(
      within(home).getByText('Otto Rangel, ATA, 4º de linha: finalização 75 (gol)'),
    ).toBeInTheDocument()
    expect(
      within(away).getByText('Lino Matos, LAT, 2º de linha: drible 79 (gol), defesa 63'),
    ).toBeInTheDocument()
  })

  it('avisa quando a partida não existe', async () => {
    fakeRoutes([])
    renderWithProviders(<AppRoutes />, '/partidas/999')

    await waitFor(() => expect(screen.getByText('Partida não encontrada')).toBeInTheDocument())
  })
})
