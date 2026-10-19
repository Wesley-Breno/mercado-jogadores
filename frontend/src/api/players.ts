import { apiDelete, apiGet, apiSend } from './client'
import { toSearchParams } from './searchParams'
import type {
  BuyRequest,
  Condition,
  Player,
  PlayerCreate,
  PlayerPage,
  PlayerQuery,
  PlayerUpdate,
  Purchase,
  Sale,
} from './types'

export function listPlayers(query: PlayerQuery): Promise<PlayerPage> {
  return apiGet<PlayerPage>(`/players${toSearchParams(query)}`)
}

export function createPlayer(player: PlayerCreate): Promise<Player> {
  return apiSend<Player>('POST', '/players', player)
}

export function updatePlayer(id: number, player: PlayerUpdate): Promise<Player> {
  return apiSend<Player>('PUT', `/players/${id}`, player)
}

export function changeCondition(id: number, condition: Condition): Promise<Player> {
  return apiSend<Player>('PATCH', `/players/${id}/condition`, { condition })
}

export function deletePlayer(id: number): Promise<void> {
  return apiDelete(`/players/${id}`)
}

export function buyPlayer(id: number, purchase: BuyRequest): Promise<Purchase> {
  return apiSend<Purchase>('POST', `/players/${id}/buy`, purchase)
}

/** RN15/RN16: no body; the API values the player at the moment of the sale. */
export function sellPlayer(id: number): Promise<Sale> {
  return apiSend<Sale>('POST', `/players/${id}/sell`)
}
