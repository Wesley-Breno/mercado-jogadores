const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const CONNECTION_ERROR = 'Não foi possível falar com a API. Confira se o backend está no ar.'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message
    }
  } catch {
    // Body without JSON: fall back to the status below.
  }
  return `A API respondeu com o erro ${response.status}.`
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, CONNECTION_ERROR)
  }
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }
  return response
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await send(path)
  return (await response.json()) as T
}

export async function apiSend<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body?: unknown) {
  const response = await send(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return (await response.json()) as T
}

export async function apiDelete(path: string): Promise<void> {
  await send(path, { method: 'DELETE' })
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await send(path)
  return response.blob()
}
