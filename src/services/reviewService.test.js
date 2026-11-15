import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import {
    createReview,
    deleteReview,
    getReview,
    getReviews,
    updateReview,
} from './reviewService'

function mockFetch(response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

const okResponse = (body, status = 200) => ({ ok: true, status, json: () => Promise.resolve(body) })
const errorResponse = (status, message) => ({
    ok: false,
    status,
    json: () => Promise.resolve({ apierror: { status: 'ERROR', message } }),
})

const REVIEW = { rating: 4, comment: 'Muy bien', date: '2026-09-05', time: '2026-09-05T14:07:00.000Z' }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getReviews', () => {
    it('requests every review when there are no filters', async () => {
        const fetchMock = mockFetch(okResponse([]))

        await getReviews()
        await getReviews({})

        expect(fetchMock.mock.calls[0][0]).toBe('/api/reviews')
        expect(fetchMock.mock.calls[1][0]).toBe('/api/reviews')
    })

    it('sends the pet and the adopter as query parameters', async () => {
        const fetchMock = mockFetch(okResponse([{ id: 1 }]))

        const result = await getReviews({ petId: 3, adopterId: ' 7 ' })

        expect(result).toEqual([{ id: 1 }])
        const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
        expect(url.pathname).toBe('/api/reviews')
        expect(url.searchParams.get('petId')).toBe('3')
        expect(url.searchParams.get('adopterId')).toBe('7')
    })

    it('leaves out blank or missing filters', async () => {
        const fetchMock = mockFetch(okResponse([]))

        await getReviews({ petId: 3, adopterId: '' })
        await getReviews({ petId: null, adopterId: 7 })

        const first = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
        const second = new URL(fetchMock.mock.calls[1][0], 'http://localhost')
        expect(first.searchParams.has('adopterId')).toBe(false)
        expect(second.searchParams.has('petId')).toBe(false)
        expect(second.searchParams.get('adopterId')).toBe('7')
    })
})

describe('getReview', () => {
    it('requests one review of a pet', async () => {
        const fetchMock = mockFetch(okResponse({ id: 5 }))

        expect(await getReview(3, 5)).toEqual({ id: 5 })
        expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/3/reviews/5')
    })

    it('fails with the message sent by the back-end', async () => {
        mockFetch(errorResponse(404, 'Review not found'))

        const error = await getReview(3, 999).catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(404)
        expect(error.message).toBe('Review not found')
    })
})

describe('createReview', () => {
    it('posts the review with its adoption on the pet reviews url', async () => {
        const fetchMock = mockFetch(okResponse({ id: 9 }, 201))
        const review = { ...REVIEW, adoption: { id: 4 } }

        expect(await createReview(3, review)).toEqual({ id: 9 })
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/pets/3/reviews')
        expect(options.method).toBe('POST')
        expect(JSON.parse(options.body)).toEqual(review)
    })

    it('fails when the pet was not adopted', async () => {
        mockFetch(errorResponse(412, 'The adopter can only review a pet with which it has had a finalized adoption process'))

        const error = await createReview(3, REVIEW).catch((e) => e)

        expect(error.status).toBe(412)
    })
})

describe('updateReview', () => {
    it('puts the review on its url saying who the author is', async () => {
        const fetchMock = mockFetch(okResponse({ id: 5 }))

        await updateReview(3, 5, 7, REVIEW)

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/pets/3/reviews/5?adopterId=7')
        expect(options.method).toBe('PUT')
        expect(JSON.parse(options.body)).toEqual(REVIEW)
    })

    it('fails when the user is not the author', async () => {
        mockFetch(errorResponse(412, 'Only the adopter who authored the review can perform this operation'))

        const error = await updateReview(3, 5, 8, REVIEW).catch((e) => e)

        expect(error.message).toBe('Only the adopter who authored the review can perform this operation')
    })
})

describe('deleteReview', () => {
    it('sends a DELETE saying who the author is and accepts the empty answer', async () => {
        const fetchMock = mockFetch({ ok: true, status: 204 })

        expect(await deleteReview(3, 5, 7)).toBeNull()
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/pets/3/reviews/5?adopterId=7')
        expect(options.method).toBe('DELETE')
    })
})