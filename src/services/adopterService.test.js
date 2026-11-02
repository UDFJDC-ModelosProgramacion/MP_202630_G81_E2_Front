import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdopter } from './adopterService'

const createdResponse = (body) => ({
  ok: true,
  status: 201,
  json: () => Promise.resolve(body),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createAdopter', () => {
  it('posts the adopter to /api/adopters and returns the created record', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createdResponse({ id: 9 }))
    vi.stubGlobal('fetch', fetchMock)

    const adopter = await createAdopter({ firstName: 'María', nationalId: '1020304050' })

    expect(adopter).toEqual({ id: 9 })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adopters')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      firstName: 'María',
      nationalId: '1020304050',
    })
  })

  it('fails with the backend message when the adopter is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        json: () =>
          Promise.resolve({
            apierror: { message: 'An adopter with the same national id already exists' },
          }),
      }),
    )

    await expect(createAdopter({ nationalId: '1020304050' })).rejects.toThrow(
      'An adopter with the same national id already exists',
    )
  })
})
