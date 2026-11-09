import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { deleteAdoption, getAdoption } from '../../services/adoptionService'
import {
  adoptionStatusLabel,
  canDeleteAdoption,
  canEditAdoption,
  canViewAdoption,
} from '../../utils/adoptions'
import { formatDay, sortByDateDescending } from '../../utils/dates'
import styles from './AdoptionDetailPage.module.css'

const dayOf = (value) => String(value ?? '').slice(0, 10)

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

const DELETE_ERROR_HINT =
  'Verifique la adopción antes de continuar o comuníquese con la administración si considera que se trata de un error.'

export default function AdoptionDetailPage() {
  const { adoptionId } = useParams()
  const navigate = useNavigate()
  const session = getSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', adoption: null, message: '' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    let mounted = true
    getAdoption(adoptionId)
      .then((adoption) => {
        if (mounted) setResult({ status: 'ready', adoption, message: '' })
      })
      .catch((error) => {
        if (mounted) setResult({ status: 'error', adoption: null, message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [adoptionId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAdoption(adoptionId)
      navigate('/adoptions/shelter', { state: { deleted: result.adoption.pet?.name } })
    } catch (error) {
      setDeleting(false)
      setConfirmingDelete(false)
      setDeleteError({ message: error.message, status: error.status })
    }
  }

  const { status, adoption, message } = result
  const isShelter = session.role === ROLES.SHELTER_ADMIN
  const backPath = isShelter ? '/adoptions/shelter' : '/adoptions/mine'
  const backLabel = isShelter ? 'Volver a las adopciones del refugio' : 'Volver a mis adopciones'
  const backLink = (
    <Link to={backPath} className={styles.backLink}>
      {backLabel}
    </Link>
  )

  if (status === 'loading') {
    return <ScreenState state="loading" message="Cargando la adopción..." />
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message={message} />
        <div className={styles.toolbar}>
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
          {backLink}
        </div>
      </section>
    )
  }

  if (!canViewAdoption(adoption, session)) {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message="No tienes acceso a esta adopción." />
        <div className={styles.toolbar}>{backLink}</div>
      </section>
    )
  }

  const reviews = sortByDateDescending(adoption.reviews ?? [])
  const followUps = sortByDateDescending(adoption.followUps ?? [])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Adopción</p>
        <h1 className={styles.title}>
          {adoption.pet?.name} — {adoption.pet?.species}
        </h1>
        <span className={styles.status} data-status={adoption.status}>
          {adoptionStatusLabel(adoption.status)}
        </span>
      </header>

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Adoptante</dt>
          <dd>{adopterName(adoption.adopter)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Contacto</dt>
          <dd>{`${adoption.adopter?.email ?? ''} · ${adoption.adopter?.phone ?? ''}`}</dd>
        </div>
        <div className={styles.row}>
          <dt>Refugio</dt>
          <dd>{adoption.shelter?.name ?? adoption.pet?.shelter?.name}</dd>
        </div>
        <div className={styles.row}>
          <dt>Fecha de la adopción</dt>
          <dd>
            <time dateTime={dayOf(adoption.date)}>{formatDay(adoption.date)}</time>
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Solicitud de adopción</dt>
          <dd>{adoption.adoptionRequest ? `#${adoption.adoptionRequest.id}` : 'Sin solicitud'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Notas importantes</dt>
          <dd className={styles.notes}>{adoption.importantNotes}</dd>
        </div>
      </dl>

      <section className={styles.section} aria-labelledby="reviews-title">
        <h2 id="reviews-title" className={styles.sectionTitle}>
          Reseñas
        </h2>
        {reviews.length === 0 ? (
          <p>Esta adopción aún no tiene reseñas.</p>
        ) : (
          <ul className={styles.items}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.item}>
                <p className={styles.itemHeader}>
                  <strong>Calificación: {review.rating}</strong>
                  <time dateTime={dayOf(review.date)}>{formatDay(review.date)}</time>
                </p>
                <p className={styles.itemText}>{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="follow-ups-title">
        <h2 id="follow-ups-title" className={styles.sectionTitle}>
          Seguimientos
        </h2>
        {followUps.length === 0 ? (
          <p>Esta adopción aún no tiene seguimientos.</p>
        ) : (
          <ul className={styles.items}>
            {followUps.map((followUp) => (
              <li key={followUp.id} className={styles.item}>
                <p className={styles.itemHeader}>
                  <time dateTime={dayOf(followUp.date)}>{formatDay(followUp.date)}</time>
                </p>
                <p className={styles.itemText}>{followUp.observation}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.toolbar}>
        {canEditAdoption(adoption, session) && (
          <Link to={`/adoptions/${adoption.id}/edit`} className={styles.editLink}>
            Editar adopción
          </Link>
        )}
        {canDeleteAdoption(adoption, session) && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => setConfirmingDelete(true)}
          >
            Eliminar adopción
          </button>
        )}
        {backLink}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="¿Eliminar esta adopción?"
          message={`La adopción de ${adoption.pet?.name} por ${adopterName(adoption.adopter)} se borrará. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar adopción"
          cancelLabel="Mantener adopción"
          pendingLabel="Eliminando..."
          pending={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {deleteError && (
        <ErrorDialog
          title="No se pudo eliminar la adopción"
          message={deleteError.message}
          status={deleteError.status}
          hint={DELETE_ERROR_HINT}
          actionLabel="Cerrar"
          onClose={() => setDeleteError(null)}
        />
      )}
    </section>
  )
}
