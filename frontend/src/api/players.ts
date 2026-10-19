import { apiGet, apiSend } from './client'
import type { Player, PlayerCreate, PlayerPage, PlayerQuery } from './types'

export function toSearchParams(query: PlayerQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export function listPlayers(query: PlayerQuery): Promise<PlayerPage> {
  return apiGet<PlayerPage>(`/players${toSearchParams(query)}`)
}

export function createPlayer(player: PlayerCreate): Promise<Player> {
  return apiSend<Player>('POST', '/players', player)
}
