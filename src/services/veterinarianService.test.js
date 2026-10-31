import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './apiClient'
import { createVeterinarian, getVeterinarian, getVeterinarians } from './veterinarianService'

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

const errorResponse = (status, body) => ({
  ok: false,
  status,
  json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error('no body')),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getVeterinarians', () => {
  it('requests every veterinarian when there are no filters', async () => {
    const fetchMock = mockFetch(okResponse([{ id: 1 }]))

    const result = await getVeterinarians()

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/veterinarians', expect.any(Object))
  })

  it('sends the trimmed filters as query parameters', async () => {
    const fetchMock = mockFetch(okResponse([]))

    await getVeterinarians({ specialization: '  Cirugía ', availability: 'Lunes a viernes' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/veterinarians')
    expect(url.searchParams.get('specialization')).toBe('Cirugía')
    expect(url.searchParams.get('availability')).toBe('Lunes a viernes')
  })

  it('leaves out blank filters', async () => {
    const fetchMock = mockFetch(okResponse([]))

    await getVeterinarians({ specialization: '   ', availability: 'Fines de semana' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.has('specialization')).toBe(false)
    expect(url.searchParams.get('availability')).toBe('Fines de semana')
  })
})

describe('getVeterinarian', () => {
  it('requests one veterinarian by id', async () => {
    const fetchMock = mockFetch(okResponse({ id: 7 }))

    const result = await getVeterinarian(7)

    expect(result).toEqual({ id: 7 })
    expect(fetchMock).toHaveBeenCalledWith('/api/veterinarians/7', expect.any(Object))
  })

  it('fails with the message sent by the backend', async () => {
    mockFetch(
      errorResponse(404, {
        apierror: { status: 'NOT_FOUND', message: 'Veterinarian not found' },
      }),
    )

    const error = await getVeterinarian(999).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Veterinarian not found')
    expect(error.status).toBe(404)
  })
})

describe('createVeterinarian', () => {
  const NEW_VETERINARIAN = {
    firstName: 'Camila',
    lastName: 'Rojas',
    email: 'camila@refugio.com',
    phone: '3001234567',
    specialization: 'Cirugía',
    availability: 'Lunes a viernes',
  }

  it('posts the veterinarian as JSON and returns the created one', async () => {
    const fetchMock = mockFetch(okResponse({ id: 9, ...NEW_VETERINARIAN }, 201))

    const result = await createVeterinarian(NEW_VETERINARIAN)

    expect(result).toEqual({ id: 9, ...NEW_VETERINARIAN })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/veterinarians')
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(options.body)).toEqual(NEW_VETERINARIAN)
  })

  it('fails with the message sent by the backend when the e-mail is already registered', async () => {
    mockFetch(
      errorResponse(412, {
        apierror: {
          status: 'PRECONDITION_FAILED',
          message: 'Two veterinarians cannot be associated with the same user; this user already exists',
        },
      }),
    )

    const error = await createVeterinarian(NEW_VETERINARIAN).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(412)
    expect(error.message).toBe(
      'Two veterinarians cannot be associated with the same user; this user already exists',
    )
  })
})

describe('apiClient', () => {
  it('falls back to a generic message when the error has no body', async () => {
    mockFetch(errorResponse(500))

    await expect(api.get('/veterinarians')).rejects.toThrow('Error 500')
  })

  it('falls back to a generic message when the body has no apierror', async () => {
    mockFetch(errorResponse(400, { other: true }))

    await expect(api.get('/veterinarians')).rejects.toThrow('Error 400')
  })

  it('explains that the server could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await api.get('/veterinarians').catch((e) => e)

    expect(error.message).toBe('No se pudo conectar con el servidor. Inténtalo de nuevo.')
    expect(error.status).toBe(0)
  })

  it('returns null for an empty 204 answer', async () => {
    mockFetch({ ok: true, status: 204 })

    await expect(api.get('/veterinarians/1')).resolves.toBeNull()
  })
})
