import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createVaccinationRecord,
    deleteVaccinationRecord,
    getVaccinationRecordByPet,
} from './vaccinationRecordService'
import { stubApiFetch } from '../test/mockApiFetch'

function mockFetch(response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    stubApiFetch(fetchMock)
    return fetchMock
}

const okResponse = (body, status = 200) => ({ ok: true, status, json: () => Promise.resolve(body) })

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getVaccinationRecordByPet', () => {
    it('requests the record of a pet', async () => {
        const fetchMock = mockFetch(okResponse({ id: 8, vaccines: [] }))

        expect(await getVaccinationRecordByPet(3)).toEqual({ id: 8, vaccines: [] })
        expect(fetchMock.mock.calls[0][0]).toBe('/api/vaccinationRecords/pet/3')
    })

    it('reports that the pet has no record with the message of the back-end', async () => {
        mockFetch({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ apierror: { message: 'Vaccination record not found for that pet' } }),
        })

        const error = await getVaccinationRecordByPet(3).catch((e) => e)

        expect(error.status).toBe(404)
        expect(error.message).toBe('Vaccination record not found for that pet')
    })
})

describe('createVaccinationRecord', () => {
    it('posts the pet as a number', async () => {
        const fetchMock = mockFetch(okResponse({ id: 9 }, 201))

        await createVaccinationRecord('3')

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/vaccinationRecords')
        expect(options.method).toBe('POST')
        expect(JSON.parse(options.body)).toEqual({ pet: { id: 3 } })
    })
})

describe('deleteVaccinationRecord', () => {
    it('sends a DELETE and accepts the empty answer', async () => {
        const fetchMock = mockFetch({ ok: true, status: 204 })

        expect(await deleteVaccinationRecord(8)).toBeNull()
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/vaccinationRecords/8')
        expect(options.method).toBe('DELETE')
    })

    it('fails when the pet is still in the shelter', async () => {
        mockFetch({
            ok: false,
            status: 412,
            json: () =>
                Promise.resolve({
                    apierror: { message: 'Vaccination record cannot be deleted while the pet is still active in the shelter' },
                }),
        })

        const error = await deleteVaccinationRecord(8).catch((e) => e)

        expect(error.status).toBe(412)
    })
})