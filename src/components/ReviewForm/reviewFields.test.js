import { describe, expect, it } from 'vitest'
import { dayStartISO } from '../../utils/dates'
import {
    buildReviewPayload,
    EMPTY_VALUES,
    fieldOfBackendMessage,
    initialValues,
    timeOfDay,
    validateReview,
} from './reviewFields'

const VALID = { rating: 4, date: '2026-09-05', comment: 'Max se adaptó muy rápido' }

describe('initialValues', () => {
    it('turns a review of the back-end into form values', () => {
        expect(
            initialValues({ rating: 5, date: '2026-09-05T00:00:00.000+00:00', comment: 'Excelente' }),
        ).toEqual({ rating: 5, date: '2026-09-05', comment: 'Excelente' })
    })

    it('uses empty values for what the review does not have', () => {
        expect(initialValues({})).toEqual(EMPTY_VALUES)
    })
})

describe('validateReview', () => {
    it('accepts a complete review', () => {
        expect(validateReview(VALID)).toEqual({})
    })

    it('reports every required field when all are empty', () => {
        expect(validateReview(EMPTY_VALUES)).toEqual({
            rating: 'Selecciona una calificación.',
            date: 'Selecciona la fecha.',
            comment: 'Escribe un comentario.',
        })
    })

    it('accepts the limits of the rating and rejects anything outside 1 to 5', () => {
        expect(validateReview({ ...VALID, rating: 1 })).toEqual({})
        expect(validateReview({ ...VALID, rating: 5 })).toEqual({})
        expect(validateReview({ ...VALID, rating: 6 })).toEqual({
            rating: 'La calificación debe estar entre 1 y 5.',
        })
        expect(validateReview({ ...VALID, rating: -1 })).toEqual({
            rating: 'La calificación debe estar entre 1 y 5.',
        })
        expect(validateReview({ ...VALID, rating: 3.5 })).toEqual({
            rating: 'La calificación debe estar entre 1 y 5.',
        })
    })

    it('rejects a date that is not real', () => {
        expect(validateReview({ ...VALID, date: '2026-02-30' })).toEqual({
            date: 'Ingresa una fecha válida.',
        })
    })

    it('treats a comment made only of spaces as empty', () => {
        expect(validateReview({ ...VALID, comment: '   ' })).toEqual({
            comment: 'Escribe un comentario.',
        })
    })
})

describe('timeOfDay', () => {
    it('gives the UTC hours and minutes of a moment', () => {
        expect(timeOfDay(new Date('2026-09-05T14:07:59.000Z'))).toBe('14:07')
    })

    it('uses the current moment when none is given', () => {
        expect(timeOfDay()).toMatch(/^\d{2}:\d{2}$/)
    })
})

describe('buildReviewPayload', () => {
    it('trims the comment and joins the day and the time', () => {
        expect(buildReviewPayload({ ...VALID, comment: '  Muy bien ' }, '14:07')).toEqual({
            rating: 4,
            comment: 'Muy bien',

            date: dayStartISO('2026-09-05'),
            time: '2026-09-05T14:07:00.000Z',
        })
    })
})

describe('fieldOfBackendMessage', () => {
    it('maps the back-end messages about a field to that field', () => {
        expect(fieldOfBackendMessage('Rating cannot be null')).toBe('rating')
        expect(fieldOfBackendMessage('Rating must be between 1 and 5')).toBe('rating')
        expect(fieldOfBackendMessage('Comment cannot be null or empty')).toBe('comment')
        expect(fieldOfBackendMessage('Date cannot be null')).toBe('date')
    })

    it('returns null for any other message', () => {
        expect(fieldOfBackendMessage('Review not found')).toBeNull()
        expect(fieldOfBackendMessage(undefined)).toBeNull()
    })
})