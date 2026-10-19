import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { respondWith, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { PlayerEditDialog } from './PlayerEditDialog'

function renderDialog(player = fakePlayer()) {
  const onClose = vi.fn()
  renderWithProviders(<PlayerEditDialog player={player} onClose={onClose} />)
  return { dialog: screen.getByRole('dialog', { name: 'Editar jogador' }), onClose }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PlayerEditDialog', () => {
  it('começa com os dados atuais e trava a posição de quem tem clube', () => {
    respondWith(200, fakePlayer())
    const { dialog } = renderDialog()

    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Danilo Freitas')
    expect(within(dialog).getByLabelText('Idade')).toHaveValue('30')
    expect(within(dialog).getByRole('radio', { name: /ZAG/ })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: /ATA/ })).toBeDisabled()
    expect(within(dialog).getByText(/Jogador com clube não muda de posição/)).toBeInTheDocument()
  })

  it('jogador livre pode mudar de posição', () => {
    respondWith(200, fakePlayer())
    const { dialog } = renderDialog(fakePlayer({ club_id: null }))

    expect(within(dialog).getByRole('radio', { name: /ATA/ })).toBeEnabled()
  })

  it('não deixa a idade diminuir', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(200, fakePlayer())
    const { dialog } = renderDialog()

    await user.clear(within(dialog).getByLabelText('Idade'))
    await user.type(within(dialog).getByLabelText('Idade'), '29')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    expect(within(dialog).getByLabelText('Idade')).toHaveAccessibleDescription(
      'A idade não pode diminuir (atual: 30).',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia o PUT e avisa o novo valor de mercado devolvido pela API', async () => {
    const user = userEvent.setup()
    const fetchMock = respondWith(
      200,
      fakePlayer({ name: 'Danilo Freitas Neto', age: 31, market_value: 32.4 }),
    )
    const { dialog, onClose } = renderDialog()

    await user.clear(within(dialog).getByLabelText('Nome'))
    await user.type(within(dialog).getByLabelText('Nome'), 'Danilo Freitas Neto')
    await user.clear(within(dialog).getByLabelText('Idade'))
    await user.type(within(dialog).getByLabelText('Idade'), '31')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Jogador atualizado')).toBeInTheDocument()
    expect(
      screen.getByText('Danilo Freitas Neto foi salvo. Valor de mercado: 32,40.'),
    ).toBeInTheDocument()
    expect(sentRequest(fetchMock)).toEqual({
      method: 'PUT',
      path: '/players/7',
      body: { name: 'Danilo Freitas Neto', position: 'ZAG', age: 31, agility: 25 },
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('mostra o message da API quando a edição é recusada', async () => {
    const user = userEvent.setup()
    respondWith(409, { message: 'Jogador com clube não pode mudar de posição.' })
    const { dialog, onClose } = renderDialog(fakePlayer({ club_id: null }))

    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Jogador com clube não pode mudar de posição.',
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
