import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import { addPetPhoto, createPet, deletePet, getPet, getPets } from './petService'
import { stubApiFetch } from '../test/mockApiFetch'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createPet', () => {
  it('posts the pet as JSON and returns the created pet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 12, name: 'Luna' }),
    })
    stubApiFetch(fetchMock)

    const result = await createPet({ name: 'Luna', shelter: { id: 1 } })

    expect(result).toEqual({ id: 12, name: 'Luna' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/pets')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': 'test-csrf-token',
    })
    expect(JSON.parse(options.body)).toEqual({ name: 'Luna', shelter: { id: 1 } })
  })

  it('fails with the message sent by the backend', async () => {
    stubApiFetch(
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        json: () =>
          Promise.resolve({
            apierror: { status: 'PRECONDITION_FAILED', message: 'El nombre de la mascota no puede ser nulo ni estar vacío' },
          }),
      }),
    )

    const error = await createPet({}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('El nombre de la mascota no puede ser nulo ni estar vacío')
    expect(error.status).toBe(412)
  })
})

describe('addPetPhoto', () => {
  it('posts the photo to the photos of the pet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 4 }),
    })
    stubApiFetch(fetchMock)
    const photo = { url: 'https://x.com/luna.jpg', type: 'JPG', description: 'Foto de perfil' }

    const result = await addPetPhoto(12, photo)

    expect(result).toEqual({ id: 4 })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/pets/12/photos')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual(photo)
  })
})

describe('getPets and getPet', () => {
  const okJson = (body) => ({ ok: true, status: 200, json: () => Promise.resolve(body) })

  it('requests the list of pets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson([{ id: 1 }]))
    stubApiFetch(fetchMock)

    expect(await getPets()).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets')
  })

  it('requests one pet and encodes its id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 7 }))
    stubApiFetch(fetchMock)

    expect(await getPet('7/../x')).toEqual({ id: 7 })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/7%2F..%2Fx')
  })
})

describe('deletePet', () => {
  it('sends a DELETE request and resolves without content on 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    stubApiFetch(fetchMock)

    expect(await deletePet('7/../x')).toBeNull()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/pets/7%2F..%2Fx')
    expect(options.method).toBe('DELETE')
    expect(options.body).toBeUndefined()
  })

  it.each([
    [404, 'Mascota no encontrada'],
    [412, 'La mascota no se puede eliminar por sus relaciones o historial'],
  ])('preserves the backend message for status %s', async (status, message) => {
    stubApiFetch(
      vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: () => Promise.resolve({ apierror: { message } }),
      }),
    )

    await expect(deletePet(7)).rejects.toMatchObject({ status, message })
  })
})