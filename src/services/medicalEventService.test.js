import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteMedicalEvent, getMedicalEvents } from './medicalEventService'

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

describe('getMedicalEvents', () => {
  it('requests every medical event when there are no filters', async () => {
    const fetchMock = mockFetch(okResponse([{ id: 1 }]))

    const result = await getMedicalEvents({ petId: '', type: '', date: '' })

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/medicalEvents', expect.any(Object))
  })

  it('sends the pet, the type and the day as query parameters', async () => {
    const fetchMock = mockFetch(okResponse([]))

    await getMedicalEvents({ petId: '7', type: 'Cirugia', date: '2026-09-10' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/medicalEvents')
    expect(url.searchParams.get('petId')).toBe('7')
    expect(url.searchParams.get('type')).toBe('Cirugia')
    expect(url.searchParams.get('date')).toBe('2026-09-10')
  })

  it('leaves out the blank filters', async () => {
    const fetchMock = mockFetch(okResponse([]))

    await getMedicalEvents({ petId: '', type: '   ', date: '2026-09-10' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.has('petId')).toBe(false)
    expect(url.searchParams.has('type')).toBe(false)
    expect(url.searchParams.get('date')).toBe('2026-09-10')
  })
})

describe('deleteMedicalEvent', () => {
  it('sends a DELETE request and resolves without content', async () => {
    const fetchMock = mockFetch({ ok: true, status: 204 })

    const result = await deleteMedicalEvent(4)

    expect(result).toBeNull()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/medicalEvents/4')
    expect(options.method).toBe('DELETE')
  })
})
