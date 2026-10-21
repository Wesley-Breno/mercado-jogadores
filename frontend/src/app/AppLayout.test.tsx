import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ClubDetail } from '../api/types'
import { fakeRoutes } from '../test/fakeFetch'
import { renderWithProviders } from '../test/renderWithProviders'
import { AppRoutes } from './AppRoutes'

const CLUB: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
  players: [],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Layout', () => {
  it('o título da aba do navegador acompanha a tela', async () => {
    fakeRoutes([{ path: '/clubs/1', body: CLUB }])
    renderWithProviders(<AppRoutes />, '/clubes/1')

    await waitFor(() => expect(document.title).toBe('Águias FC · Passe'))
  })

  it('"Pular para o conteúdo" é o primeiro item do Tab e leva o foco ao conteúdo', async () => {
    const user = userEvent.setup()
    fakeRoutes([])
    renderWithProviders(<AppRoutes />, '/classificacao')

    await user.tab()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('ao trocar de tela, o foco vai para o conteúdo da nova tela', async () => {
    const user = userEvent.setup()
    fakeRoutes([])
    renderWithProviders(<AppRoutes />, '/classificacao')
    expect(document.title).toBe('Classificação · Passe')

    await user.click(screen.getByRole('link', { name: /^Clubes/ }))

    expect(screen.getByRole('main')).toHaveFocus()
    expect(document.title).toBe('Clubes · Passe')
  })
})
