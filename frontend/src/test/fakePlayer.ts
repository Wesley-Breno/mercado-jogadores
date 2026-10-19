import type { Player } from '../api/types'

/** A valid player as the API returns it, with the changes each test needs. */
export function fakePlayer(changes: Partial<Player> = {}): Player {
  return {
    id: 7,
    name: 'Danilo Freitas',
    position: 'ZAG',
    agility: 25,
    age: 30,
    condition: 'APTO',
    base_value: 36,
    market_value: 36,
    pace: 60,
    shooting: 40,
    passing: 62,
    dribbling: 50,
    defending: 80,
    physical: 75,
    potential: 80,
    overall: 73,
    club_id: 2,
    ...changes,
  }
}
