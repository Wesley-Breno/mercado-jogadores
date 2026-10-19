import { apiGet } from './client'
import type { Club } from './types'

export function listClubs(): Promise<Club[]> {
  return apiGet<Club[]>('/clubs')
}
