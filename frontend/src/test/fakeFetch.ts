import { vi } from 'vitest'

/** Every request gets the same answer; the mock keeps the calls for the assertions. */
export function respondWith(status: number, body: unknown) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Method, path after /api/v1 and JSON body of a recorded call. */
export function sentRequest(fetchMock: ReturnType<typeof respondWith>, index = 0) {
  const [input, init] = fetchMock.mock.calls[index]
  return {
    method: init?.method ?? 'GET',
    path: new URL(String(input)).pathname.replace('/api/v1', ''),
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  }
}

type Route = {
  method?: string
  path: string
  status?: number
  body?: unknown
}

/**
 * A small fake API: each request gets the first route with its method (GET by default) and its
 * path after /api/v1 (with the query string, when the route has one); anything else is a 404, as
 * the real API would answer.
 */
export function fakeRoutes(routes: Route[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const url = new URL(String(input))
    const path = url.pathname.replace('/api/v1', '')
    const route = routes.find(
      (item) =>
        (item.method ?? 'GET') === method &&
        item.path === (item.path.includes('?') ? `${path}${url.search}` : path),
    )
    if (!route) {
      return new Response(JSON.stringify({ message: 'Rota não encontrada.' }), { status: 404 })
    }
    const status = route.status ?? 200
    return new Response(status === 204 ? null : JSON.stringify(route.body), { status })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
