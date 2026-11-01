import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import { createShelter } from './shelterService'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createShelter', () => {
  it('posts the shelter as JSON and returns the created shelter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 3, name: 'Patitas Felices' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const shelter = { name: 'Patitas Felices', users: [{ id: 1 }] }

    const result = await createShelter(shelter)

    expect(result).toEqual({ id: 3, name: 'Patitas Felices' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/shelters')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual(shelter)
  })

  it('fails with the message and status sent by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        json: () =>
          Promise.resolve({
            apierror: {
              status: 'PRECONDITION_FAILED',
              message: 'The nit is already registered for another shelter',
            },
          }),
      }),
    )

    const error = await createShelter({}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('The nit is already registered for another shelter')
    expect(error.status).toBe(412)
  })
})