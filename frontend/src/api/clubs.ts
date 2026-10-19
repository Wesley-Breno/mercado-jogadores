import { apiGet, apiSend } from './client'
import type { Club, ClubCreate, ClubSort } from './types'

export function listClubs(sort: ClubSort): Promise<Club[]> {
  return apiGet<Club[]>(`/clubs?sort=${sort}`)
}

export function createClub(club: ClubCreate): Promise<Club> {
  return apiSend<Club>('POST', '/clubs', club)
}
