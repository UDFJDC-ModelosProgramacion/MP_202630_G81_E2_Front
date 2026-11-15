import { api } from './apiClient'

const petReviewsPath = (petId) => `/pets/${encodeURIComponent(petId)}/reviews`
const reviewPath = (petId, reviewId) => `${petReviewsPath(petId)}/${encodeURIComponent(reviewId)}`
const asAuthor = (adopterId) => `?adopterId=${encodeURIComponent(adopterId)}`

function setParam(params, name, value) {
    const text = String(value ?? '').trim()
    if (text) params.set(name, text)
}


export function getReviews({ petId, adopterId } = {}) {
    const params = new URLSearchParams()
    setParam(params, 'petId', petId)
    setParam(params, 'adopterId', adopterId)
    const query = params.toString()
    return api.get(query ? `/reviews?${query}` : '/reviews')
}

export const getReview = (petId, reviewId) => api.get(reviewPath(petId, reviewId))


export const createReview = (petId, review) => api.post(petReviewsPath(petId), review)


export const updateReview = (petId, reviewId, adopterId, review) =>
    api.put(`${reviewPath(petId, reviewId)}${asAuthor(adopterId)}`, review)

export const deleteReview = (petId, reviewId, adopterId) =>
    api.delete(`${reviewPath(petId, reviewId)}${asAuthor(adopterId)}`)