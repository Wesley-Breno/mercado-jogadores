/** Setup through the API, so each spec only drives on screen the steps it checks. */
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'

type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA'

export type PlayerSeed = {
  name: string
  position: Position
  age?: number
  agility?: number
  level?: number
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${await response.text()}`)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}

export function get<T>(path: string): Promise<T> {
  return send<T>('GET', path)
}

/** All six attributes at `level` and the potential a bit above it (RN06 limits). */
export async function createPlayer({
  name,
  position,
  age = 25,
  agility = 70,
  level = 60,
}: PlayerSeed) {
  return send<{ id: number; name: string }>('POST', '/players', {
    name,
    position,
    age,
    agility,
    pace: level,
    shooting: level,
    passing: level,
    dribbling: level,
    defending: level,
    physical: level,
    potential: Math.min(level + 5, 99),
  })
}

export async function createClub(name: string, acronym: string) {
  return send<{ id: number; name: string }>('POST', '/clubs', { name, acronym })
}

/** RN01: the end of loyalty `days` from now, typed in Brasília time, with -03:00. */
export function loyaltyIn(days: number): string {
  const { year, month, day } = brasiliaParts(new Date(Date.now() + days * 86_400_000))
  return `${year}-${month}-${day}T15:00-03:00`
}

export async function buyPlayer(playerId: number, clubId: number, days = 120) {
  return send('POST', `/players/${playerId}/buy`, {
    club_id: clubId,
    loyalty_until: loyaltyIn(days),
  })
}

export async function sellPlayer(playerId: number) {
  return send('POST', `/players/${playerId}/sell`)
}

export async function deletePlayer(playerId: number) {
  return send('DELETE', `/players/${playerId}`)
}

export async function setCondition(playerId: number, condition: string) {
  return send('PATCH', `/players/${playerId}/condition`, { condition })
}

export async function saveLineup(clubId: number, formation: string, playerIds: number[]) {
  return send('PUT', `/clubs/${clubId}/lineup`, { formation, player_ids: playerIds })
}

/** A club that buys one player per position (cheap ones) and saves the 2-1-1 lineup. */
export async function clubReadyToPlay(name: string, acronym: string, names: string[]) {
  const club = await createClub(name, acronym)
  const positions: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']
  const ids: number[] = []
  for (const [index, position] of positions.entries()) {
    const player = await createPlayer({ name: names[index], position, level: 50 + index * 3 })
    await buyPlayer(player.id, club.id)
    ids.push(player.id)
  }
  await saveLineup(club.id, '2-1-1', ids)
  return club
}

/** Date and time parts of an instant in Brasília, with two digits ("05", "09"). */
export function brasiliaParts(instant: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return { year: part('year'), month: part('month'), day: part('day') }
}

/** The E2E specs follow the evaluation script, which starts from a recreated database. */
export async function assertEmptyLeague(): Promise<void> {
  const [clubs, players] = await Promise.all([
    get<unknown[]>('/clubs'),
    get<{ meta: { total_items: number } }>('/players?limit=1'),
  ])
  if (clubs.length > 0 || players.meta.total_items > 0) {
    throw new Error(
      'Os testes de ponta a ponta partem do banco recriado. Na raiz do repositório, rode ' +
        '"docker compose exec backend alembic downgrade base" e ' +
        '"docker compose exec backend alembic upgrade head" e tente de novo.',
    )
  }
}
