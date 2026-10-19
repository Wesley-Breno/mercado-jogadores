import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { respondWith } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { CreatePlayer } from './CreatePlayer'

const MEIA_LUA_FIELDS = {
  Nome: 'Meia Lua',
  Idade: '25',
  Agilidade: '85',
  Velocidade: '70',
  Finalização: '68',
  Passe: '82',
  Drible: '79',
  Defesa: '55',
  Físico: '64',
  Potencial: '86',
}

const CREATED = {
  id: 2,
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  condition: 'APTO',
  base_value: 40,
  market_value: 40,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 75,
  club_id: null,
}

async function openForm(user: UserEvent) {
  renderWithProviders(<CreatePlayer />)
  await user.click(screen.getByRole('button', { name: 'Novo jogador' }))
  return screen.getByRole('dialog', { name: 'Novo jogador' })
}

async function fill(user: UserEvent, dialog: HTMLElement, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    await user.type(within(dialog).getByLabelText(label), value)
  }
  await user.click(within(dialog).getByRole('radio', { name: /MEI/ }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CreatePlayer', () => {
  it('valida os campos antes de enviar, com a mensagem junto a cada um', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(201, CREATED)
    const dialog = await openForm(user)

    await fill(user, dialog, { ...MEIA_LUA_FIELDS, Nome: 'Da', Idade: '15', Passe: '120' })
    await user.clear(within(dialog).getByLabelText('Potencial'))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar jogador' }))

    expect(within(dialog).getByLabelText('Nome')).toHaveAccessibleDescription(
      'Use de 3 a 100 caracteres.',
    )
    expect(within(dialog).getByLabelText('Idade')).toHaveAccessibleDescription(
      'Use uma idade de 16 a 45 anos.',
    )
    expect(within(dialog).getByLabelText('Passe')).toHaveAccessibleDescription(
      'Use um valor de 1 a 99.',
    )
    expect(within(dialog).getByLabelText('Potencial')).toHaveAccessibleDescription(
      'Informe o potencial.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia o jogador e mostra os valores devolvidos pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(201, CREATED)
    const dialog = await openForm(user)

    await fill(user, dialog, MEIA_LUA_FIELDS)
    await user.click(within(dialog).getByRole('button', { name: 'Salvar jogador' }))

    const result = await screen.findByRole('dialog', { name: 'Jogador cadastrado' })
    expect(within(result).getAllByText('40,00')).toHaveLength(2)
    expect(within(result).getByText('75')).toBeInTheDocument()
    expect(within(result).getByText(/Meia Lua entrou livre e Apto/)).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/players$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Meia Lua',
      position: 'MEI',
      age: 25,
      agility: 85,
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
      potential: 86,
    })
  })

  it('mostra o message da API quando o cadastro é recusado', async () => {
    const user = userEvent.setup()
    respondWith(400, { message: 'O potencial não pode ser menor que o maior dos seis atributos.' })
    const dialog = await openForm(user)

    await fill(user, dialog, MEIA_LUA_FIELDS)
    await user.click(within(dialog).getByRole('button', { name: 'Salvar jogador' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O potencial não pode ser menor que o maior dos seis atributos.',
    )
    expect(within(dialog).getByRole('button', { name: 'Salvar jogador' })).toBeEnabled()
  })

  it('envia um só pedido no clique duplo', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(201, CREATED)
    const dialog = await openForm(user)

    await fill(user, dialog, MEIA_LUA_FIELDS)
    await user.dblClick(within(dialog).getByRole('button', { name: 'Salvar jogador' }))

    await screen.findByRole('dialog', { name: 'Jogador cadastrado' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('abre com o foco no nome', async () => {
    const user = userEvent.setup()
    respondWith(201, CREATED)
    const dialog = await openForm(user)

    expect(within(dialog).getByLabelText('Nome')).toHaveFocus()
  })

  it('cancelar fecha o formulário sem enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(201, CREATED)
    const dialog = await openForm(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
