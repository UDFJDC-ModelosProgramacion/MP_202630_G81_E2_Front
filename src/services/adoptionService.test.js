import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdoption } from './adoptionService'

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createAdoption', () => {
  it('posts the adoption as JSON and returns the created one', async () => {
    const adoption = {
      date: '2026-11-04T00:00:00-05:00',
      status: 'IN_PROGRESS',
      importantNotes: 'Revisar vacunas cada mes',
      pet: { id: 1 },
      shelter: { id: 1 },
      adopter: { id: 2 },
      adoptionRequest: { id: 11 },
    }
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 7, ...adoption }),
    })

    const result = await createAdoption(adoption)

    expect(result).toEqual({ id: 7, ...adoption })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adoptions')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual(adoption)
  })
})
