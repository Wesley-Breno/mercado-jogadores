import { apiGet } from './client'
import type { StandingRow } from './types'

export function getStandings(): Promise<StandingRow[]> {
  return apiGet<StandingRow[]>('/standings')
}
