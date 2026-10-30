import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import { createPet } from './petService'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createPet', () => {
  it('posts the pet as JSON and returns the created pet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 12, name: 'Luna' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createPet({ name: 'Luna', shelter: { id: 1 } })

    expect(result).toEqual({ id: 12, name: 'Luna' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/pets')
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(options.body)).toEqual({ name: 'Luna', shelter: { id: 1 } })
  })

  it('fails with the message sent by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        json: () =>
          Promise.resolve({
            apierror: { status: 'PRECONDITION_FAILED', message: 'Pet name cannot be null or empty' },
          }),
      }),
    )

    const error = await createPet({}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Pet name cannot be null or empty')
    expect(error.status).toBe(412)
  })
})
