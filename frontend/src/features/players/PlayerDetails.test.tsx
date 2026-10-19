import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Club } from '../../api/types'
import { fakePlayer } from '../../test/fakePlayer'
import { renderWithProviders } from '../../test/renderWithProviders'
import { PlayerDetails } from './PlayerDetails'

const EDUARDO = fakePlayer({
  name: 'Eduardo Paiva',
  position: 'MEI',
  club_id: null,
  market_value: 46,
  base_value: 46,
  overall: 76,
  potential: 86,
  pace: 70,
  passing: 84,
  age: 26,
  agility: 68,
})

const AGUIAS: Club = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
}

describe('PlayerDetails', () => {
  it('mostra os valores da API, os atributos e as ações de um jogador livre', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    renderWithProviders(
      <PlayerDetails player={EDUARDO} club={undefined} onClose={vi.fn()} onAction={onAction} />,
    )

    const panel = screen.getByRole('dialog', { name: 'Eduardo Paiva' })
    expect(within(panel).getByRole('group', { name: 'Valor de mercado' })).toHaveTextContent(
      '46,00',
    )
    expect(within(panel).getByRole('group', { name: 'Overall' })).toHaveTextContent('76')
    expect(within(panel).getByRole('group', { name: 'Potencial' })).toHaveTextContent('86')
    const indicators = within(panel).getByRole('region', { name: 'Indicadores técnicos' })
    expect(within(indicators).getByText('Passe').nextSibling?.nextSibling).toHaveTextContent('84')
    expect(within(panel).getByText('26 anos')).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: 'Comprar' }))

    expect(onAction).toHaveBeenCalledWith('buy')
  })

  it('jogador com clube mostra o clube e não oferece a compra', () => {
    renderWithProviders(
      <PlayerDetails
        player={{ ...EDUARDO, club_id: 1 }}
        club={AGUIAS}
        onClose={vi.fn()}
        onAction={vi.fn()}
      />,
    )

    const panel = screen.getByRole('dialog', { name: 'Eduardo Paiva' })
    expect(within(panel).getByText('AGU')).toBeInTheDocument()
    expect(within(panel).getByText('Águias FC')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()
  })
})
