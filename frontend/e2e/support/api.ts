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
  return (await response.json()) as T
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
