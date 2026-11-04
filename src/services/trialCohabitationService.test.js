import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTrialCohabitationRequest,
  getTrialCohabitationRequest,
  getTrialCohabitationRequests,
} from './trialCohabitationService'

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const okResponse = (body, status = 200) => ({
  ok: true,
  status,
  json: () => Promise.resolve(body),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getTrialCohabitationRequest', () => {
  it('requests one request by id', async () => {
    const fetchMock = mockFetch(okResponse({ id: 5, status: 'PENDING' }))

    const result = await getTrialCohabitationRequest(5)

    expect(result).toEqual({ id: 5, status: 'PENDING' })
    expect(fetchMock).toHaveBeenCalledWith('/api/trialCohabitationRequests/5', expect.any(Object))
  })
})

describe('getTrialCohabitationRequests', () => {
  it('requests every request when there are no filters', async () => {
    const fetchMock = mockFetch(okResponse([{ id: 1 }]))

    const result = await getTrialCohabitationRequests({ adopterId: '' })

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/trialCohabitationRequests', expect.any(Object))
  })

  it('sends the adopter, the pet and the status as query parameters', async () => {
    const fetchMock = mockFetch(okResponse([]))

    await getTrialCohabitationRequests({ adopterId: 2, petId: 1, status: ' PENDING ' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/trialCohabitationRequests')
    expect(url.searchParams.get('adopterId')).toBe('2')
    expect(url.searchParams.get('petId')).toBe('1')
    expect(url.searchParams.get('status')).toBe('PENDING')
  })
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
