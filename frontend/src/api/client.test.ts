import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiGet, apiSend } from './client'

function respond(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cliente da API', () => {
  it('devolve o corpo JSON das respostas de sucesso', async () => {
    respond(200, { status: 'ok' })

    await expect(apiGet('/health')).resolves.toEqual({ status: 'ok' })
  })

  it('transforma a recusa num ApiError com o message da API', async () => {
    respond(409, { message: 'O custo da compra passa do limite de 50% do caixa.' })

    await expect(apiSend('POST', '/players/1/buy', {})).rejects.toEqual(
      new ApiError(409, 'O custo da compra passa do limite de 50% do caixa.'),
    )
  })

  it('avisa quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiGet('/players')).rejects.toMatchObject({ status: 0 })
  })
})
