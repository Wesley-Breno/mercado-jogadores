import type { Condition, DuelAttribute, DuelPlayer, Match, Position } from '../../api/types'
import { ATTRIBUTE_LABELS, ATTRIBUTE_SHORT_LABELS } from './labels'

export type FieldPlayer = {
  id: number
  name: string
  position: Position
  condition: Condition
  /** 0 for the goalkeeper; 1 (furthest back) to 4 (furthest forward) for the outfield players. */
  line: number
  attack?: { attribute: DuelAttribute; value: number; goal: boolean }
  defence?: number
}

/** RN20: the 3 attacks of a club come from its 4th, 3rd and 2nd outfield players… */
const ATTACKER_LINES = [4, 3, 2]
/** …against the goalkeeper and the 1st and 2nd outfield players of the other club. */
const DEFENDER_LINES = [0, 1, 2]

/**
 * The 5 starters of a club in a played match, gathered from the 6 duels the API recorded, with the
 * values of that moment (already with the condition). Nothing is recalculated.
 */
export function startersOf(match: Match, clubId: number): FieldPlayer[] {
  const starters = new Map<number, FieldPlayer>()
  const starter = (player: DuelPlayer, line: number): FieldPlayer => {
    const known = starters.get(player.player_id) ?? {
      id: player.player_id,
      name: player.player_name,
      position: player.position,
      condition: player.condition,
      line,
    }
    starters.set(player.player_id, known)
    return known
  }
  match.duels
    .filter((duel) => duel.attacking_club_id === clubId)
    .forEach((duel, index) => {
      starter(duel.attacker, ATTACKER_LINES[index]).attack = {
        attribute: duel.attacker.attribute,
        value: duel.attacker.value,
        goal: duel.goal,
      }
    })
  match.duels
    .filter((duel) => duel.attacking_club_id !== clubId)
    .forEach((duel, index) => {
      starter(duel.defender, DEFENDER_LINES[index]).defence = duel.defender.value
    })
  return [...starters.values()].sort((a, b) => a.line - b.line)
}

/** What the pitch shows under the name: "LAT · Dri 63 · Def 56". */
export function duelValues(player: FieldPlayer): string {
  const { attack, defence } = player
  return [
    player.position,
    attack && `${ATTRIBUTE_SHORT_LABELS[attack.attribute]} ${attack.value}`,
    defence !== undefined && `${ATTRIBUTE_SHORT_LABELS.defending} ${defence}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** The same in words, for screen readers: "Davi Lins, LAT, 2º de linha, mal condicionado: …". */
export function describeStarter(player: FieldPlayer): string {
  const { attack, defence } = player
  const who = [
    player.name,
    player.position,
    player.line > 0 && `${player.line}º de linha`,
    player.condition === 'MAL_CONDICIONADO' && 'mal condicionado',
  ]
  const values = [
    attack &&
      `${ATTRIBUTE_LABELS[attack.attribute].toLowerCase()} ${attack.value}${attack.goal ? ' (gol)' : ''}`,
    defence !== undefined && `${ATTRIBUTE_LABELS.defending.toLowerCase()} ${defence}`,
  ]
  return `${who.filter(Boolean).join(', ')}: ${values.filter(Boolean).join(', ')}`
}
