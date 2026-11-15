import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { SelectField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import { Stars } from '../../components/StarRating/StarRating'
import { getSession, ROLES } from '../../config/roleSession'
import { getPet } from '../../services/petService'
import { getReviews } from '../../services/reviewService'
import { formatShortDate } from '../../utils/dateFields'
import {
    authorName,
    averageRating,
    collectAdopters,
    formatAverage,
    reviewCountLabel,
    sortReviews,
} from '../../utils/reviews'
import styles from './PetReviewsPage.module.css'

const BANNERS = {
    published: 'Tu reseña se publicó correctamente.',
    updated: 'Tu reseña se actualizó correctamente.',
    deleted: 'Tu reseña se eliminó correctamente.',
}

const bannerOf = (state) => {
    const key = Object.keys(BANNERS).find((name) => state?.[name])
    return key ? BANNERS[key] : null
}

export default function PetReviewsPage() {
    const { petId } = useParams()
    const { state } = useLocation()
    const { userId, role } = getSession()
    const isAdopter = role === ROLES.ADOPTER

    const [selected, setSelected] = useState('')
    const [applied, setApplied] = useState('')
    const [knownAdopters, setKnownAdopters] = useState([])

    const [result, setResult] = useState({ key: null, pet: null, reviews: [], message: '' })
    const [mine, setMine] = useState({ key: null, ids: [] })
    const requestKey = `${petId}|${applied}`
    const mineKey = `${petId}|${userId}`

    useEffect(() => {
        let cancelled = false
        Promise.all([getPet(petId), getReviews({ petId, adopterId: applied })])
            .then(([pet, reviews]) => {
                if (cancelled) return
                setResult({ key: requestKey, pet, reviews: sortReviews(reviews), message: '' })
                if (!applied) setKnownAdopters(collectAdopters(reviews))
            })
            .catch((error) => {
                if (!cancelled) setResult({ key: requestKey, pet: null, reviews: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [petId, applied, requestKey])


    useEffect(() => {
        if (!isAdopter) return undefined
        let cancelled = false
        getReviews({ petId, adopterId: userId })
            .then((reviews) => {
                if (!cancelled) setMine({ key: mineKey, ids: reviews.map((review) => review.id) })
            })
            .catch(() => {
                if (!cancelled) setMine({ key: mineKey, ids: [] })
            })
        return () => {
            cancelled = true
        }
    }, [petId, userId, isAdopter, mineKey])

    const mineLoaded = isAdopter && mine.key === mineKey
    const myIds = mineLoaded ? mine.ids : []

    const adopterOptions = [
        ...(isAdopter ? [{ value: String(userId), label: 'Mis reseñas' }] : []),
        ...knownAdopters
            .filter((adopter) => !(isAdopter && String(adopter.id) === String(userId)))
            .map((adopter) => ({ value: String(adopter.id), label: adopter.name })),
    ]

    const banner = bannerOf(state)
    const { pet, reviews, message } = result
    let content
    if (result.key !== requestKey) content = <ScreenState state="loading" />
    else if (reviews === null) {
        content = (
            <>
                <ScreenState state="error" message={message} />
                <Link to={`/pets/${petId}`}>Volver a la mascota</Link>
            </>
        )
    } else {
        const average = averageRating(reviews)
        content = (
            <>
                <div className={styles.summary}>
                    <p className={styles.average}>{formatAverage(average)}</p>
                    {average !== null && <Stars rating={average} label={`${formatAverage(average)} de 5`} />}
                    <p className={styles.count}>{reviewCountLabel(reviews.length)}</p>
                </div>
                {reviews.length === 0 ? (
                    <ScreenState
                        state="empty"
                        message={
                            applied
                                ? 'No hay reseñas de ese adoptante para esta mascota.'
                                : 'Esta mascota aún no tiene reseñas.'
                        }
                    />
                ) : (
                    <ul className={styles.list}>
                        {reviews.map((review) => (
                            <li key={review.id} className={styles.card}>
                                <div className={styles.row}>
                                    <h2 className={styles.author}>{authorName(review)}</h2>
                                    <p className={styles.date}>{formatShortDate(review.date)}</p>
                                    <Stars rating={review.rating} />
                                </div>
                                <p className={styles.comment}>{review.comment}</p>
                                {myIds.includes(review.id) && (
                                    <Link to={`/pets/${petId}/reviews/${review.id}/edit`}>Editar mi reseña</Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </>
        )
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Reseñas{pet ? ` de ${pet.name}` : ''}</h1>
                {mineLoaded && myIds.length === 0 && (
                    <Link to={`/pets/${petId}/reviews/new`}>Escribir reseña</Link>
                )}
            </header>

            {banner && (
                <p role="status" className={styles.success}>
                    {banner}
                </p>
            )}

            <form
                className={styles.filters}
                noValidate
                aria-label="Filtro de reseñas"
                onSubmit={(event) => {
                    event.preventDefault()
                    setApplied(selected)
                }}
            >
                <SelectField
                    id="adopterId"
                    name="adopterId"
                    label="Adoptante"
                    placeholder="Todos"
                    value={selected}
                    options={adopterOptions}
                    onChange={(event) => setSelected(event.target.value)}
                />
                <button type="submit" className={styles.submit}>
                    Buscar
                </button>
            </form>

            {content}
        </section>
    )
}