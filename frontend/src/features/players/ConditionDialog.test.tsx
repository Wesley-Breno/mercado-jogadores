import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fakeRoutes, respondWith, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ConditionDialog } from './ConditionDialog'

const NO_LINEUP = { club_id: 2, formation: null, complete: false, players: [] }

function renderDialog(player = fakePlayer()) {
  const onClose = vi.fn()
  renderWithProviders(<ConditionDialog player={player} onClose={onClose} />)
  return { dialog: screen.getByRole('dialog', { name: 'Alterar condição física' }), onClose }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ConditionDialog', () => {
  it('de Doente não deixa escolher Apto', () => {
    respondWith(200, fakePlayer())
    const { dialog } = renderDialog(fakePlayer({ condition: 'DOENTE' }))

    expect(within(dialog).getByRole('radio', { name: /^Apto/ })).toBeDisabled()
    expect(within(dialog).getByRole('radio', { name: /^Doente/ })).toBeChecked()
    expect(within(dialog).getByText('De Doente não passa direto para Apto.')).toBeInTheDocument()
  })

  it('envia o PATCH e avisa o valor de mercado devolvido pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeRoutes([
      { path: '/clubs/2/lineup', body: NO_LINEUP },
      {
        method: 'PATCH',
        path: '/players/7/condition',
        body: fakePlayer({ condition: 'MAL_CONDICIONADO', market_value: 34.73 }),
      },
    ])
    const { dialog, onClose } = renderDialog()

    await user.click(within(dialog).getByRole('radio', { name: /^Mal condicionado/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar condição' }))

    expect(await screen.findByText('Condição alterada')).toBeInTheDocument()
    expect(
      screen.getByText('Danilo Freitas agora está Mal condicionado. Valor de mercado: 34,73.'),
    ).toBeInTheDocument()
    expect(sentRequest(fetchMock, 1)).toEqual({
      method: 'PATCH',
      path: '/players/7/condition',
      body: { condition: 'MAL_CONDICIONADO' },
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('avisa que o titular sai da escalação ao passar a Doente', async () => {
    const user = userEvent.setup()
    fakeRoutes([
      {
        path: '/clubs/2/lineup',
        body: { ...NO_LINEUP, formation: '2-1-1', players: [fakePlayer()] },
      },
    ])
    const { dialog } = renderDialog()

    await user.click(within(dialog).getByRole('radio', { name: /^Doente/ }))

    expect(await within(dialog).findByText('Danilo Freitas é titular')).toBeInTheDocument()
  })

  it('não avisa quando o jogador não é titular', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeRoutes([{ path: '/clubs/2/lineup', body: NO_LINEUP }])
    const { dialog } = renderDialog()

    await user.click(within(dialog).getByRole('radio', { name: /^Doente/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(within(dialog).queryByText(/é titular/)).not.toBeInTheDocument()
  })

  it('mostra o message da API quando o jogador não existe mais', async () => {
    const user = userEvent.setup()
    respondWith(404, { message: 'Jogador não encontrado.' })
    const { dialog } = renderDialog()

    await user.click(within(dialog).getByRole('button', { name: 'Salvar condição' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Jogador não encontrado.')
  })
})
