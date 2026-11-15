import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReviewForm from '../../components/ReviewForm/ReviewForm'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getPet } from '../../services/petService'
import { createReview } from '../../services/reviewService'
import { findFinalizedAdoption } from '../../utils/reviews'
import styles from './WriteReviewPage.module.css'

const NOT_ADOPTED =
    'Solo puede reseñar mascotas con adopción finalizada. Una reseña por mascota.'

function WriteReviewForm({ pet, adoption }) {
    const navigate = useNavigate()

    async function publish(review) {
        await createReview(pet.id, { ...review, adoption: { id: adoption.id } })
        navigate(`/pets/${pet.id}/reviews`, { state: { published: true } })
    }

    return (
        <ReviewForm
            petName={pet.name}
            ariaLabel="Escritura de reseña"
            submitLabel="Publicar"
            notice={NOT_ADOPTED}
            backPath={`/pets/${pet.id}/reviews`}
            onSubmit={publish}
        />
    )
}

function WriteReviewLoader({ petId }) {
    const [result, setResult] = useState({ status: 'loading', pet: null, message: '' })

    useEffect(() => {
        let cancelled = false
        getPet(petId)
            .then((pet) => {
                if (!cancelled) setResult({ status: 'ready', pet, message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ status: 'error', pet: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [petId])

    const { status, pet, message } = result
    if (status === 'loading') return <ScreenState state="loading" />
    if (status === 'error') return <ScreenState state="error" message={message} />

    const adoption = findFinalizedAdoption(pet)
    if (!adoption) return <ScreenState state="error" message={NOT_ADOPTED} />
    return <WriteReviewForm pet={pet} adoption={adoption} />
}

export default function WriteReviewPage() {
    const { petId } = useParams()
    const allowed = getSession().role === ROLES.ADOPTER

    return (
        <section className={styles.page}>
            <Link to={`/pets/${petId}/reviews`}>Volver a las reseñas</Link>
            <h1 className={styles.title}>Escriba su reseña</h1>
            {allowed ? (
                <WriteReviewLoader key={petId} petId={petId} />
            ) : (
                <ScreenState state="error" message="Solo un adoptante puede escribir una reseña." />
            )}
        </section>
    )
}