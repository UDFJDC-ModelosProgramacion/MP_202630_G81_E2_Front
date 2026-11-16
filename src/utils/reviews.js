export const MAX_RATING = 5

export const ratingLabel = (rating) => `${rating} de ${MAX_RATING}`

export const reviewCountLabel = (count) => (count === 1 ? '1 reseña' : `${count} reseñas`)


export function averageRating(reviews) {
    const ratings = reviews.map((review) => review.rating).filter((rating) => typeof rating === 'number')
    if (ratings.length === 0) return null
    return ratings.reduce((total, rating) => total + rating, 0) / ratings.length
}


export const formatAverage = (average) => (average === null ? '—' : average.toFixed(1))

const DAY = /^(\d{4}-\d{2}-\d{2})/
const TIME = /T(\d{2}:\d{2})/
const sortKey = (review) =>
    `${DAY.exec(String(review.date ?? ''))?.[1] ?? ''}${TIME.exec(String(review.time ?? ''))?.[1] ?? ''}`


export const sortReviews = (reviews) =>
    [...reviews].sort((a, b) => sortKey(b).localeCompare(sortKey(a)))


export const adopterOf = (review) =>
    review.author ?? review.adoption?.adopter ?? review.adopter ?? null

export function authorName(review) {
    const adopter = adopterOf(review)
    if (adopter?.displayName?.trim()) return adopter.displayName.trim()
    const name = [adopter?.firstName, adopter?.lastName].filter(Boolean).join(' ')
    return name || 'Adoptante'
}


export function collectAdopters(reviews) {
    const byId = new Map()
    reviews.forEach((review) => {
        const adopter = adopterOf(review)
        if (adopter?.id != null && !byId.has(adopter.id)) {
            byId.set(adopter.id, { id: adopter.id, name: authorName(review) })
        }
    })
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}


export const findFinalizedAdoption = (pet) =>
    (pet.adoptions ?? []).find((adoption) => String(adoption.status ?? '').toUpperCase() === 'FINALIZED') ??
    null