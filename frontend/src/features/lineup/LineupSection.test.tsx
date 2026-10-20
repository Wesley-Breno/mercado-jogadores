import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ClubDetail, Lineup, Player, SquadPlayer } from '../../api/types'
import { AppRoutes } from '../../app/AppRoutes'
import { fakeRoutes, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'

function squadPlayer(changes: Partial<Player>): SquadPlayer {
  return {
    ...fakePlayer({ club_id: 1, ...changes }),
    contract: {
      purchase_value: 30,
      loyalty_until: '2027-06-30T18:00:00-03:00',
      remaining_days: 200,
      penalty_rate: 20,
    },
  }
}

const BRUNO = squadPlayer({ id: 1, name: 'Bruno Tavares', position: 'GOL', defending: 77 })
const FELIPE = squadPlayer({ id: 2, name: 'Felipe Moura', position: 'ZAG' })
const DIEGO = squadPlayer({
  id: 3,
  name: 'Diego Ramos',
  position: 'LAT',
  condition: 'MAL_CONDICIONADO',
  dribbling: 74,
  defending: 66,
})
const ANA = squadPlayer({ id: 4, name: 'Ana Costa', position: 'LAT' })
const SAVIO = squadPlayer({ id: 5, name: 'Sávio Lima', position: 'MEI' })
const JOAO = squadPlayer({ id: 6, name: 'João Silva', position: 'ATA' })
const LUCAS = squadPlayer({ id: 7, name: 'Lucas Ferraz', position: 'ATA', condition: 'DOENTE' })

const CLUB: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 222.68,
  net_worth: 274.26,
  players: [BRUNO, FELIPE, DIEGO, ANA, SAVIO, JOAO, LUCAS],
}

const NO_LINEUP: Lineup = { club_id: 1, formation: null, complete: false, players: [] }
const FULL: Lineup = {
  club_id: 1,
  formation: '2-1-1',
  complete: true,
  players: [BRUNO, FELIPE, DIEGO, SAVIO, JOAO],
}
const EMPTY_HISTORY = {
  data: [],
  summary: {
    total_spent: 0,
    total_received: 0,
    total_fees: 0,
    total_penalties: 0,
    total_profit: 0,
  },
}

function renderLineup(saved: Lineup, extra: Parameters<typeof fakeRoutes>[0] = []) {
  const fetchMock = fakeRoutes([
    ...extra,
    { path: '/clubs/1', body: CLUB },
    { path: '/clubs/1/lineup', body: saved },
    { path: '/clubs/1/transactions', body: EMPTY_HISTORY },
  ])
  renderWithProviders(<AppRoutes />, '/clubes/1?aba=escalacao')
  return fetchMock
}

async function pick(user: UserEvent, slotIndex: number, playerName: string) {
  const select = (await screen.findAllByRole('combobox'))[slotIndex]
  await user.selectOptions(select, within(select).getByRole('option', { name: playerName }))
}

function puts(fetchMock: ReturnType<typeof fakeRoutes>) {
  return fetchMock.mock.calls
    .map((_, index) => sentRequest(fetchMock, index))
    .filter((request) => request.method === 'PUT')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Escalação', () => {
  it('sem escalação, avisa que o clube não pode jogar e só oferece quem pode ser escalado', async () => {
    renderLineup(NO_LINEUP)

    expect(
      await screen.findByText('Escalação incompleta: o Águias FC não pode jogar partidas'),
    ).toBeInTheDocument()
    expect(screen.getByText('Incompleta')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /2-1-1/ })).toBeChecked()
    const [goalkeeper, defence, , , attack] = screen.getAllByRole('combobox')
    expect(
      within(goalkeeper)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Escolha o titular', 'Bruno Tavares (GOL)'])
    expect(within(defence).getAllByRole('option')).toHaveLength(4)
    expect(within(attack).queryByRole('option', { name: /Lucas Ferraz/ })).not.toBeInTheDocument()
  })

  it('pede um titular em cada vaga antes de enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = renderLineup(NO_LINEUP)
    await screen.findByText('Incompleta')

    await pick(user, 0, 'Bruno Tavares (GOL)')
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(screen.getAllByText('Escolha um titular para esta vaga.')).toHaveLength(4)
    expect(puts(fetchMock)).toEqual([])
  })

  it('salva a formação e os 5 titulares e mostra a escalação devolvida pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = renderLineup(NO_LINEUP, [
      { method: 'PUT', path: '/clubs/1/lineup', body: FULL },
    ])
    await screen.findByText('Incompleta')

    await pick(user, 0, 'Bruno Tavares (GOL)')
    await pick(user, 1, 'Felipe Moura (ZAG)')
    await pick(user, 2, 'Diego Ramos (LAT)')
    await pick(user, 3, 'Sávio Lima (MEI)')
    await pick(user, 4, 'João Silva (ATA)')
    expect(screen.getByText('Diego Ramos está mal condicionado')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(await screen.findByText('Escalação salva')).toBeInTheDocument()
    expect(puts(fetchMock)).toEqual([
      {
        method: 'PUT',
        path: '/clubs/1/lineup',
        body: { formation: '2-1-1', player_ids: [1, 2, 3, 5, 6] },
      },
    ])
    expect(await screen.findByText('Completa')).toBeInTheDocument()
    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument()
  })

  it('mostra a escalação incompleta salva com quem sobrou', async () => {
    renderLineup({ ...FULL, complete: false, players: [BRUNO, FELIPE, DIEGO, SAVIO] })

    expect(
      await screen.findByText(/A formação 2-1-1 continua salva, com 4 de 5 titulares/),
    ).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects.map((select) => (select as HTMLSelectElement).value)).toEqual([
      '1',
      '2',
      '3',
      '5',
      '',
    ])
  })

  it('ao trocar a formação, mantém quem cabe nas novas vagas', async () => {
    const user = userEvent.setup()
    renderLineup(FULL)
    await screen.findByText('Completa')

    await user.click(screen.getByRole('radio', { name: /3-1/ }))

    const selects = screen.getAllByRole('combobox')
    const starters = screen.getByRole('region', { name: 'Titulares' })
    expect(within(starters).getAllByText('Defesa')).toHaveLength(3)
    expect(selects.map((select) => (select as HTMLSelectElement).value)).toEqual([
      '1',
      '2',
      '3',
      '',
      '6',
    ])
  })

  it('mostra em campo os titulares escolhidos e, nas reservas, quem ficou de fora', async () => {
    const user = userEvent.setup()
    renderLineup({ ...FULL, complete: false, players: [BRUNO, FELIPE, DIEGO, SAVIO] })
    const pitch = await screen.findByRole('region', { name: 'Em campo' })
    const reserves = screen.getByRole('region', { name: 'Reservas' })

    expect(within(pitch).getByText('Goleiro: Bruno Tavares')).toBeInTheDocument()
    expect(within(pitch).getByText('Defesa: Diego Ramos, mal condicionado')).toBeInTheDocument()
    expect(within(pitch).getByText('Ataque: vaga vazia')).toBeInTheDocument()
    expect(within(pitch).getByText(/A vaga vazia fica tracejada/)).toBeInTheDocument()
    const reserveItems = within(reserves).getAllByRole('listitem')
    expect(reserveItems).toHaveLength(3)
    expect(reserveItems[1]).toHaveTextContent('João Silva')
    expect(reserveItems[2]).toHaveTextContent(/Lucas Ferraz.*Doente não pode ser escalado\./)

    await pick(user, 4, 'João Silva (ATA)')

    expect(within(pitch).getByText('Ataque: João Silva')).toBeInTheDocument()
    expect(within(pitch).queryByText(/A vaga vazia fica tracejada/)).not.toBeInTheDocument()
    expect(within(reserves).queryByText('João Silva')).not.toBeInTheDocument()
  })

  it('mostra o message da API e mantém as escolhas quando a escalação é recusada', async () => {
    const user = userEvent.setup()
    renderLineup(FULL, [
      {
        method: 'PUT',
        path: '/clubs/1/lineup',
        status: 409,
        body: { message: 'O jogador Ana Costa não é do elenco do clube.' },
      },
    ])
    await screen.findByText('Completa')

    await pick(user, 2, 'Ana Costa (LAT)')
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O jogador Ana Costa não é do elenco do clube.',
    )
    await waitFor(() =>
      expect((screen.getAllByRole('combobox')[2] as HTMLSelectElement).value).toBe('4'),
    )
  })
})
