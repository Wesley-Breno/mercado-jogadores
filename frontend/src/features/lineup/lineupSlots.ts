import type { Formation, Player, Position } from '../../api/types'

export type Sector = 'GOL' | 'DEF' | 'MEI' | 'ATA'

export type Slot = {
  key: string
  sector: Sector
}

type FormationInfo = {
  description: string
  sectors: Record<Exclude<Sector, 'GOL'>, number>
}

/** RN19: the four formations count the 4 outfield players by sector, from back to front. */
export const FORMATIONS: Record<Formation, FormationInfo> = {
  '3-1': { description: 'Defesa 3, ataque 1', sectors: { DEF: 3, MEI: 0, ATA: 1 } },
  '2-2': { description: 'Defesa 2, ataque 2', sectors: { DEF: 2, MEI: 0, ATA: 2 } },
  '2-1-1': { description: 'Defesa 2, meio 1, ataque 1', sectors: { DEF: 2, MEI: 1, ATA: 1 } },
  '1-2-1': { description: 'Defesa 1, meio 2, ataque 1', sectors: { DEF: 1, MEI: 2, ATA: 1 } },
}

export const SECTOR_LABELS: Record<Sector, { name: string; positions: string }> = {
  GOL: { name: 'Goleiro', positions: 'GOL' },
  DEF: { name: 'Defesa', positions: 'ZAG ou LAT' },
  MEI: { name: 'Meio', positions: 'MEI' },
  ATA: { name: 'Ataque', positions: 'ATA' },
}

const SECTOR_OF: Record<Position, Sector> = {
  GOL: 'GOL',
  ZAG: 'DEF',
  LAT: 'DEF',
  MEI: 'MEI',
  ATA: 'ATA',
}

/** Chosen player of each slot, by slot key. */
export type Choices = Record<string, number | undefined>

/** The 5 places of a formation: the goalkeeper, then defence, midfield and attack. */
export function slotsOf(formation: Formation): Slot[] {
  const { sectors } = FORMATIONS[formation]
  const outfield = (['DEF', 'MEI', 'ATA'] as const).flatMap((sector) =>
    Array.from({ length: sectors[sector] }, (_, index) => ({ key: `${sector}-${index}`, sector })),
  )
  return [{ key: 'GOL-0', sector: 'GOL' }, ...outfield]
}

function fitsSlot(player: Player, slot: Slot): boolean {
  return SECTOR_OF[player.position] === slot.sector
}

/** Puts each player in the first free place of his sector; who does not fit is left out. */
export function distribute(formation: Formation, players: Player[]): Choices {
  const choices: Choices = {}
  for (const player of players) {
    const slot = slotsOf(formation).find(
      (candidate) => fitsSlot(player, candidate) && choices[candidate.key] === undefined,
    )
    if (slot) {
      choices[slot.key] = player.id
    }
  }
  return choices
}

/**
 * Who can take a place: a squad player of that sector who is not DOENTE and is not already in
 * another place. These choices are the ones the statement lets the screen prevent.
 */
export function candidatesFor(slot: Slot, squad: Player[], choices: Choices): Player[] {
  const taken = new Set(
    Object.entries(choices)
      .filter(([key, id]) => key !== slot.key && id !== undefined)
      .map(([, id]) => id),
  )
  return squad.filter(
    (player) => fitsSlot(player, slot) && player.condition !== 'DOENTE' && !taken.has(player.id),
  )
}

/** F2: a starter in each of the 5 places before sending. */
export function missingSlots(formation: Formation, choices: Choices): string[] {
  return slotsOf(formation)
    .filter((slot) => choices[slot.key] === undefined)
    .map((slot) => slot.key)
}

/** The ids in the order of the places, as PUT /clubs/{id}/lineup receives them. */
export function playerIds(formation: Formation, choices: Choices): number[] {
  return slotsOf(formation).flatMap((slot) => choices[slot.key] ?? [])
}
