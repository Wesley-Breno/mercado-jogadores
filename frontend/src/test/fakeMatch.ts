import type { Condition, Duel, DuelAttribute, DuelPlayer, Match, Position } from '../api/types'

function player(
  id: number,
  name: string,
  position: Position,
  attribute: DuelAttribute,
  value: number,
  condition: Condition = 'APTO',
): DuelPlayer {
  return { player_id: id, player_name: name, position, condition, attribute, value }
}

function duel(order: number, attacker: DuelPlayer, defender: DuelPlayer, goal: boolean): Duel {
  return { order, attacking_club_id: order <= 3 ? 1 : 2, attacker, defender, goal }
}

/** The RN20 example: Águias FC 1 × 2 Delta FC, both in the 2-1-1, with the 6 duels. */
export const AGUIAS_DELTA: Match = {
  id: 1,
  played_at: '2026-11-12T15:00:00-03:00',
  home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
  away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
  result: 'VISITANTE',
  duels: [
    duel(
      1,
      player(34, 'Otto Rangel', 'ATA', 'shooting', 75),
      player(40, 'Ivo Teles', 'GOL', 'defending', 72),
      true,
    ),
    duel(
      2,
      player(33, 'Lauro Neves', 'MEI', 'passing', 82),
      player(41, 'Hugo Vaz', 'ZAG', 'defending', 84),
      false,
    ),
    duel(
      3,
      player(31, 'Davi Lins', 'LAT', 'dribbling', 63, 'MAL_CONDICIONADO'),
      player(42, 'Lino Matos', 'LAT', 'defending', 63),
      false,
    ),
    duel(
      4,
      player(44, 'Ugo Falcão', 'ATA', 'shooting', 81),
      player(30, 'Rui Prado', 'GOL', 'defending', 77),
      true,
    ),
    duel(
      5,
      player(43, 'Nei Soares', 'MEI', 'passing', 70),
      player(32, 'Téo Brandão', 'ZAG', 'defending', 84),
      false,
    ),
    duel(
      6,
      player(42, 'Lino Matos', 'LAT', 'dribbling', 79),
      player(31, 'Davi Lins', 'LAT', 'defending', 56, 'MAL_CONDICIONADO'),
      true,
    ),
  ],
}
