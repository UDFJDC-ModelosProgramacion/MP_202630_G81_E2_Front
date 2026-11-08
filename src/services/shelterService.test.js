import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import { createShelter, getShelter, getShelters } from './shelterService'

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
              message: 'El NIT ya está registrado para otro refugio',
            },
          }),
      }),
    )

    const error = await createShelter({}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('El NIT ya está registrado para otro refugio')
    expect(error.status).toBe(412)
  })
})

function stubFetchWith(body) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('getShelters', () => {
  it('requests every shelter when there are no filters', async () => {
    const fetchMock = stubFetchWith([{ id: 1 }])

    const result = await getShelters()

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/shelters')
  })

  it('sends only the filters that have text, trimmed', async () => {
    const fetchMock = stubFetchWith([])

    await getShelters({ city: ' Cali ', location: '   ' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/shelters?city=Cali')
  })

  it('sends both filters when both are given', async () => {
    const fetchMock = stubFetchWith([])

    await getShelters({ city: 'Bogotá', location: 'Carrera 15 # 85 - 32' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/shelters')
    expect(url.searchParams.get('city')).toBe('Bogotá')
    expect(url.searchParams.get('location')).toBe('Carrera 15 # 85 - 32')
  })

  it('fails with the message sent by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ apierror: { message: 'Error interno' } }),
      }),
    )

    const error = await getShelters().catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Error interno')
  })
})

describe('getShelter', () => {
  it('requests the shelter by its id', async () => {
    const fetchMock = stubFetchWith({ id: 7, name: 'Patitas Felices' })

    const result = await getShelter(7)

    expect(result).toEqual({ id: 7, name: 'Patitas Felices' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/shelters/7')
  })

  it('encodes the id so it cannot change the address', async () => {
    const fetchMock = stubFetchWith({})

    await getShelter('1/../2')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/shelters/1%2F..%2F2')
  })

  it('fails with the status and message of the back-end when the shelter does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ apierror: { message: 'Shelter not found' } }),
      }),
    )

    const error = await getShelter(99).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.message).toBe('Shelter not found')
  })
})