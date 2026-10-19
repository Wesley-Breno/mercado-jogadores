import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { respondWith, sentRequest } from '../../test/fakeFetch'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { DeletePlayerDialog } from './DeletePlayerDialog'

const FREE_PLAYER = fakePlayer({ id: 9, name: 'Ícaro Mendes', club_id: null })

function renderDialog() {
  const onClose = vi.fn()
  renderWithProviders(<DeletePlayerDialog player={FREE_PLAYER} onClose={onClose} />)
  return { dialog: screen.getByRole('dialog', { name: 'Excluir Ícaro Mendes?' }), onClose }
}

/** 204 without body, answered a moment later, as a slow network would. */
function respondNoContent() {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        setTimeout(() => resolve(new Response(null, { status: 204 })), 50)
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeletePlayerDialog', () => {
  it('envia o DELETE e avisa que o jogador saiu da lista', async () => {
    const user = userEvent.setup()
    const fetchMock = respondNoContent()
    const { dialog, onClose } = renderDialog()

    await user.click(within(dialog).getByRole('button', { name: 'Excluir jogador' }))

    expect(await screen.findByText('Jogador excluído')).toBeInTheDocument()
    expect(sentRequest(fetchMock)).toEqual({
      method: 'DELETE',
      path: '/players/9',
      body: undefined,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('envia um só pedido no clique duplo', async () => {
    const user = userEvent.setup()
    const fetchMock = respondNoContent()
    const { dialog } = renderDialog()

    await user.dblClick(within(dialog).getByRole('button', { name: 'Excluir jogador' }))

    await screen.findByText('Jogador excluído')
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1)
  })

  it('mostra o message da API quando a exclusão é recusada', async () => {
    const user = userEvent.setup()
    respondWith(409, { message: 'Só jogador livre pode ser excluído.' })
    const { dialog, onClose } = renderDialog()

    await user.click(within(dialog).getByRole('button', { name: 'Excluir jogador' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Só jogador livre pode ser excluído.',
    )
    expect(within(dialog).getByRole('button', { name: 'Excluir jogador' })).toBeEnabled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('cancelar fecha sem enviar', async () => {
    const user = userEvent.setup()
    const fetchMock = respondNoContent()
    const { dialog, onClose } = renderDialog()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
