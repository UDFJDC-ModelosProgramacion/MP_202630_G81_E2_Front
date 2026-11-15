import { dayStartISO } from '../../utils/dates'
import { isRealDate, toDateInput } from '../../utils/dateFields'
import { MAX_RATING } from '../../utils/reviews'

export const REQUIRED_MESSAGES = {
    rating: 'Selecciona una calificación.',
    date: 'Selecciona la fecha.',
    comment: 'Escribe un comentario.',
}

const FIELD_BY_BACKEND_MESSAGE = {
    'Rating cannot be null': 'rating',
    'Rating must be between 1 and 5': 'rating',
    'Comment cannot be null or empty': 'comment',
    'Date cannot be null': 'date',
}

export const EMPTY_VALUES = { rating: 0, date: '', comment: '' }

export const initialValues = (review) => ({
    rating: review.rating ?? 0,
    date: toDateInput(review.date),
    comment: review.comment ?? '',
})

export function validateReview(values) {
    const errors = {}
    if (!values.rating) errors.rating = REQUIRED_MESSAGES.rating
    else if (!Number.isInteger(values.rating) || values.rating < 1 || values.rating > MAX_RATING) {
        errors.rating = `La calificación debe estar entre 1 y ${MAX_RATING}.`
    }

    if (!values.date) errors.date = REQUIRED_MESSAGES.date
    else if (!isRealDate(values.date)) errors.date = 'Ingresa una fecha válida.'

    if (!values.comment.trim()) errors.comment = REQUIRED_MESSAGES.comment
    return errors
}


export const timeOfDay = (now = new Date()) => now.toISOString().slice(11, 16)

export const buildReviewPayload = (values, time) => ({
    rating: values.rating,
    comment: values.comment.trim(),
    date: dayStartISO(values.date),
    time: `${values.date}T${time}:00.000Z`,
})

export const fieldOfBackendMessage = (message) => FIELD_BY_BACKEND_MESSAGE[message] ?? null