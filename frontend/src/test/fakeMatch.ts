import type { Duel, Match } from '../api/types'

function duel(order: number, goal: boolean, attackingClubId: number): Duel {
  return {
    order,
    attacking_club_id: attackingClubId,
    attacker: {
      player_id: 30 + order,
      player_name: `Atacante ${order}`,
      position: 'ATA',
      condition: order === 3 ? 'MAL_CONDICIONADO' : 'APTO',
      attribute: 'shooting',
      value: 70 + order,
    },
    defender: {
      player_id: 40 + order,
      player_name: `Defensor ${order}`,
      position: 'GOL',
      condition: 'APTO',
      attribute: 'defending',
      value: 72,
    },
    goal,
  }
}

/** The RN20 example: Águias FC 1 × 2 Delta FC, with the 6 duels. */
export const AGUIAS_DELTA: Match = {
  id: 1,
  played_at: '2026-11-12T15:00:00-03:00',
  home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
  away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
  result: 'VISITANTE',
  duels: [
    duel(1, true, 1),
    duel(2, false, 1),
    duel(3, false, 1),
    duel(4, true, 2),
    duel(5, false, 2),
    duel(6, true, 2),
  ],
}
