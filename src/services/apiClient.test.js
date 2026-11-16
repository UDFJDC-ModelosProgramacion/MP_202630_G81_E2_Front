import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, request, resetCsrfToken } from './apiClient'

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('api client authentication', () => {
  beforeEach(() => {
    resetCsrfToken()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends cookies on requests and obtains a CSRF token before mutations', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 8 }))
      .mockResolvedValueOnce(jsonResponse([]))

    await api.post('/pets', { name: 'Luna' })
    await api.get('/pets')

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/csrf'),
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/pets'),
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
        headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }),
      }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/pets'),
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('reports an invalid CSRF response rather than sending an unprotected mutation', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}))

    await expect(request('/pets', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      message: 'El servidor no devolvió un token CSRF válido.',
      status: 502,
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
