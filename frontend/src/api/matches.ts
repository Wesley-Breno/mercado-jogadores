import { apiGet, apiSend } from './client'
import { toSearchParams } from './searchParams'
import type { Match, MatchRequest, MatchSummary } from './types'

export function listMatches(clubId: number | undefined): Promise<MatchSummary[]> {
  return apiGet<MatchSummary[]>(`/matches${toSearchParams({ club_id: clubId })}`)
}

/** The id comes from the address as typed; the API answers 404 for one that is not valid. */
export function getMatch(id: string): Promise<Match> {
  return apiGet<Match>(`/matches/${encodeURIComponent(id)}`)
}

/** RN20: the API plays the match and answers the score and the 6 duels. */
export function playMatch(match: MatchRequest): Promise<Match> {
  return apiSend<Match>('POST', '/matches', match)
}
