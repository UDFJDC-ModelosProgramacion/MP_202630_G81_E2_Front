import { describe, expect, it } from 'vitest'
import {
    adopterOf,
    authorName,
    averageRating,
    collectAdopters,
    findFinalizedAdoption,
    formatAverage,
    ratingLabel,
    reviewCountLabel,
    sortReviews,
} from './reviews'

describe('ratingLabel and reviewCountLabel', () => {
    it('writes the rating out of five', () => {
        expect(ratingLabel(4)).toBe('4 de 5')
    })

    it('uses the singular for one review only', () => {
        expect(reviewCountLabel(1)).toBe('1 reseña')
        expect(reviewCountLabel(0)).toBe('0 reseñas')
        expect(reviewCountLabel(12)).toBe('12 reseñas')
    })
})

describe('averageRating and formatAverage', () => {
    it('averages the ratings', () => {
        expect(averageRating([{ rating: 5 }, { rating: 4 }])).toBe(4.5)
    })

    it('ignores reviews without a numeric rating', () => {
        expect(averageRating([{ rating: 4 }, { rating: null }, {}])).toBe(4)
    })

    it('is null when there is nothing to average', () => {
        expect(averageRating([])).toBeNull()
        expect(averageRating([{}])).toBeNull()
    })

    it('shows one decimal or a dash', () => {
        expect(formatAverage(4.5)).toBe('4.5')
        expect(formatAverage(5)).toBe('5.0')
        expect(formatAverage(null)).toBe('—')
    })
})

describe('sortReviews', () => {
    const old = { id: 1, date: '2026-08-15', time: '2026-08-15T10:00:00.000Z' }
    const sameDayLater = { id: 2, date: '2026-08-28', time: '2026-08-28T15:00:00.000Z' }
    const sameDayEarlier = { id: 3, date: '2026-08-28', time: '2026-08-28T09:00:00.000Z' }
    const newest = { id: 4, date: '2026-09-05', time: '2026-09-05T08:00:00.000Z' }

    it('puts the newest first, using the hour to break ties', () => {
        expect(sortReviews([old, sameDayEarlier, newest, sameDayLater]).map((r) => r.id)).toEqual([
            4, 2, 3, 1,
        ])
    })

    it('does not change the received list and tolerates missing dates', () => {
        const original = [{ id: 9 }, newest]

        expect(sortReviews(original).map((r) => r.id)).toEqual([4, 9])
        expect(original.map((r) => r.id)).toEqual([9, 4])
    })
})

describe('authors', () => {
    const adopter = { id: 3, firstName: 'Laura', lastName: 'Gómez' }

    it('finds the adopter in the adoption or in the review itself', () => {
        expect(adopterOf({ adoption: { adopter } })).toBe(adopter)
        expect(adopterOf({ adopter })).toBe(adopter)
        expect(adopterOf({ adoption: {} })).toBeNull()
    })

    it('writes the full name, a partial one, or a generic label', () => {
        expect(authorName({ adopter })).toBe('Laura Gómez')
        expect(authorName({ adopter: { firstName: 'Laura' } })).toBe('Laura')
        expect(authorName({})).toBe('Adoptante')
    })

    it('lists every adopter once, ordered by name, skipping reviews without author', () => {
        const reviews = [
            { adopter: { id: 2, firstName: 'Marta', lastName: 'Díaz' } },
            { adopter },
            { adopter },
            { adopter: { firstName: 'Sin id' } },
            {},
        ]

        expect(collectAdopters(reviews)).toEqual([
            { id: 3, name: 'Laura Gómez' },
            { id: 2, name: 'Marta Díaz' },
        ])
    })
})

describe('findFinalizedAdoption', () => {
    it('returns the finalized adoption, whatever the case of the status', () => {
        const adoptions = [
            { id: 1, status: 'PENDING' },
            { id: 2, status: 'finalized' },
        ]

        expect(findFinalizedAdoption({ adoptions })).toEqual({ id: 2, status: 'finalized' })
    })

    it('is null when no adoption is finalized or there are none', () => {
        expect(findFinalizedAdoption({ adoptions: [{ id: 1, status: 'PENDING' }, { id: 2 }] })).toBeNull()
        expect(findFinalizedAdoption({})).toBeNull()
    })
})