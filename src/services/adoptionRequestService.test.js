import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdoptionRequests } from './adoptionRequestService'

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getAdoptionRequests', () => {
  it('sends the pet, the status and the role of the user as query parameters', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: () => Promise.resolve([]) })

    await getAdoptionRequests({ petId: 1, status: 'APPROVED', currentUserRole: 'ADMIN' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/adoptionRequests')
    expect(url.searchParams.get('petId')).toBe('1')
    expect(url.searchParams.get('status')).toBe('APPROVED')
    expect(url.searchParams.get('currentUserRole')).toBe('ADMIN')
  })

  it('requests every adoption request when there are no filters', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: () => Promise.resolve([{ id: 1 }]) })

    const result = await getAdoptionRequests({})

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/adoptionRequests', expect.any(Object))
  })
})
