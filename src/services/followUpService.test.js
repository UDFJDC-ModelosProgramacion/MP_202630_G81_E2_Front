import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createFollowUp,
  deleteFollowUp,
  getFollowUp,
  getFollowUps,
  updateFollowUp,
} from './followUpService'

const jsonResponse = (body, status = 200) => ({
  ok: true,
  status,
  json: () => Promise.resolve(body),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getFollowUps', () => {
  it('requests the follow-ups of an adoption', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    const followUps = await getFollowUps(1)

    expect(followUps).toEqual([])
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adoptions/1/followUps')
    expect(options.method).toBeUndefined()
  })
})

describe('getFollowUp', () => {
  it('requests one follow-up without access params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 5 }))
    vi.stubGlobal('fetch', fetchMock)

    const followUp = await getFollowUp(1, 5)

    expect(followUp).toEqual({ id: 5 })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/adoptions/1/followUps/5')
  })

  it('maps the shelter administrator role to the backend role', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 5 }))
    vi.stubGlobal('fetch', fetchMock)

    await getFollowUp(1, 5, { requesterId: 7, role: 'SHELTER_ADMIN' })

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/adoptions/1/followUps/5?requesterId=7&role=ADMIN',
    )
  })
})

describe('createFollowUp', () => {
  it('posts the follow-up to the adoption', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 9 }, 201))
    vi.stubGlobal('fetch', fetchMock)

    const followUp = await createFollowUp(1, {
      date: '2030-01-15T23:59:59',
      observation: 'Buena adaptación',
      veterinarian: { id: 1 },
      adoption: { id: 1 },
    })

    expect(followUp).toEqual({ id: 9 })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adoptions/1/followUps')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      date: '2030-01-15T23:59:59',
      observation: 'Buena adaptación',
      veterinarian: { id: 1 },
      adoption: { id: 1 },
    })
  })

  it('fails with the backend message when the adoption is not finalized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        json: () =>
          Promise.resolve({
            apierror: { message: 'The associated adoption must be in finalized status' },
          }),
      }),
    )

    await expect(createFollowUp(2, {})).rejects.toThrow(
      'The associated adoption must be in finalized status',
    )
  })
})

describe('updateFollowUp', () => {
  it('sends a PUT with the date and observation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 5 }))
    vi.stubGlobal('fetch', fetchMock)

    await updateFollowUp(1, 5, { date: '2030-01-15T23:59:59', observation: 'Actualizada' })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adoptions/1/followUps/5')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({
      date: '2030-01-15T23:59:59',
      observation: 'Actualizada',
    })
  })
})

describe('deleteFollowUp', () => {
  it('sends a DELETE and returns null on 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteFollowUp(1, 5)

    expect(result).toBeNull()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/adoptions/1/followUps/5')
    expect(options.method).toBe('DELETE')
  })
})
