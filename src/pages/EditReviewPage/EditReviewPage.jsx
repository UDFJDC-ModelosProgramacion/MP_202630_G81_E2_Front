import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReviewForm from '../../components/ReviewForm/ReviewForm'
import { initialValues } from '../../components/ReviewForm/reviewFields'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { deleteReview, getReview, updateReview } from '../../services/reviewService'
import { toTimeInput } from '../../utils/dateFields'
import styles from './EditReviewPage.module.css'

function EditReviewForm({ petId, userId, review }) {
    const navigate = useNavigate()
    const listPath = `/pets/${petId}/reviews`

    async function update(changes) {
        await updateReview(petId, review.id, userId, changes)
        navigate(listPath, { state: { updated: true } })
    }

    async function remove() {
        await deleteReview(petId, review.id, userId)
        navigate(listPath, { state: { deleted: true } })
    }

    return (
        <ReviewForm
            petName={review.pet?.name ?? ''}
            defaultValues={initialValues(review)}
            time={toTimeInput(review.time)}
            ariaLabel="Edición de reseña"
            submitLabel="Guardar"
            notice="Solo el autor de la reseña puede editarla o eliminarla."
            backPath={listPath}
            onSubmit={update}
            onDelete={remove}
        />
    )
}

function EditReviewLoader({ petId, reviewId, userId }) {
    const [result, setResult] = useState({ status: 'loading', review: null, message: '' })

    useEffect(() => {
        let cancelled = false
        getReview(petId, reviewId)
            .then((review) => {
                if (!cancelled) setResult({ status: 'ready', review, message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ status: 'error', review: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [petId, reviewId])

    const { status, review, message } = result
    if (status === 'loading') return <ScreenState state="loading" />
    if (status === 'error') return <ScreenState state="error" message={message} />
    return <EditReviewForm petId={petId} userId={userId} review={review} />
}

export default function EditReviewPage() {
    const { petId, reviewId } = useParams()
    const { userId, role } = getSession()

    return (
        <section className={styles.page}>
            <Link to={`/pets/${petId}/reviews`}>Volver a las reseñas</Link>
            <h1 className={styles.title}>Mi reseña</h1>
            {role === ROLES.ADOPTER ? (
                <EditReviewLoader key={reviewId} petId={petId} reviewId={reviewId} userId={userId} />
            ) : (
                <ScreenState state="error" message="Solo un adoptante puede editar o eliminar su reseña." />
            )}
        </section>
    )
}