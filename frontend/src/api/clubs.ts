import { apiGet, apiSend } from './client'
import type { Club, ClubCreate, ClubDetail, ClubSort, Lineup, LineupRequest } from './types'

export function listClubs(sort: ClubSort): Promise<Club[]> {
  return apiGet<Club[]>(`/clubs?sort=${sort}`)
}

export function createClub(club: ClubCreate): Promise<Club> {
  return apiSend<Club>('POST', '/clubs', club)
}

/** The id comes from the address as typed; the API answers 404 for one that is not valid. */
export function getClub(id: string): Promise<ClubDetail> {
  return apiGet<ClubDetail>(`/clubs/${encodeURIComponent(id)}`)
}

export function getLineup(clubId: string): Promise<Lineup> {
  return apiGet<Lineup>(`/clubs/${encodeURIComponent(clubId)}/lineup`)
}

/** RN19: replaces the whole lineup in one operation. */
export function saveLineup(clubId: number, lineup: LineupRequest): Promise<Lineup> {
  return apiSend<Lineup>('PUT', `/clubs/${clubId}/lineup`, lineup)
}
