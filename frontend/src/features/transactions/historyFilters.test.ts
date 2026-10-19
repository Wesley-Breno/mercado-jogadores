import { describe, expect, it } from 'vitest'

import type { Transaction } from '../../api/types'
import { checkedTypes, playersInHistory, readHistoryFilters, toggleType } from './historyFilters'

function transaction(id: number, playerId: number, playerName: string): Transaction {
  return {
    id,
    club_id: 1,
    player_id: playerId,
    player_name: playerName,
    type: 'COMPRA',
    value: 10,
    fee: 0,
    penalty: 0,
    profit: null,
    cash_change: -10,
    created_at: '2026-11-02T10:15:00-03:00',
  }
}

describe('readHistoryFilters', () => {
  it('lê type e player_id do endereço e ignora o que a API recusaria', () => {
    expect(readHistoryFilters(new URLSearchParams('type=VENDA&player_id=2'))).toEqual({
      type: 'VENDA',
      player_id: 2,
    })
    expect(readHistoryFilters(new URLSearchParams('type=venda&player_id=02'))).toEqual({
      type: undefined,
      player_id: undefined,
    })
  })
})

describe('filtro de tipo', () => {
  it('sem type, as duas caixas ficam marcadas', () => {
    expect(checkedTypes({})).toEqual({ COMPRA: true, VENDA: true })
    expect(checkedTypes({ type: 'VENDA' })).toEqual({ COMPRA: false, VENDA: true })
  })

  it('desmarcar uma deixa só a outra; marcar de novo volta às duas', () => {
    expect(toggleType({}, 'COMPRA')).toEqual({ type: 'VENDA' })
    expect(toggleType({ type: 'VENDA', player_id: 2 }, 'COMPRA')).toEqual({
      type: undefined,
      player_id: 2,
    })
  })
})

describe('playersInHistory', () => {
  it('lista cada jogador uma vez, com o nome mais recente, em ordem de nome', () => {
    const history = [
      transaction(3, 2, 'Meia Lua Filho'),
      transaction(2, 5, 'Ana Costa'),
      transaction(1, 2, 'Meia Lua'),
    ]

    expect(playersInHistory(history)).toEqual([
      { id: 5, name: 'Ana Costa' },
      { id: 2, name: 'Meia Lua Filho' },
    ])
  })
})
