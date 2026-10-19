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
