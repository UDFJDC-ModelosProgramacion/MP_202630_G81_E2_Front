import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTrialCohabitationRequest } from './trialCohabitationService'

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createTrialCohabitationRequest', () => {
  it('posts the request as JSON and returns the created one', async () => {
    const request = {
      date: '2026-11-03T00:00:00-05:00',
      status: 'PENDING',
      description: 'Quiero convivir con Luna',
      startDate: '2026-11-10T00:00:00-05:00',
      endDate: '2026-11-20T00:00:00-05:00',
      shelter: { id: 1 },
      adopter: { id: 2 },
      pet: { id: 1 },
    }
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 5, ...request }),
    })

    const result = await createTrialCohabitationRequest(request)

    expect(result).toEqual({ id: 5, ...request })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/trialCohabitationRequests')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual(request)
  })
})
