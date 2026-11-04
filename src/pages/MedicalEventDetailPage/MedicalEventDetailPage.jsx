import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession } from '../../config/session'
import { deleteMedicalEvent, getMedicalEvent } from '../../services/medicalEventService'
import { formatDay } from '../../utils/dates'
import {
  canManageMedicalEvents,
  medicalEventTypeLabel,
  petSummary,
  veterinarianName,
} from '../../utils/medicalEvents'
import styles from './MedicalEventDetailPage.module.css'

const DELETE_ERROR_HINT =
  'Verifique los datos e inténtelo de nuevo. Si el problema continúa, comuníquese con la administración.'

export default function MedicalEventDetailPage() {
  const { medicalEventId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', medicalEvent: null, message: '' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const canManage = canManageMedicalEvents(getSession().role)

  useEffect(() => {
    let mounted = true
    getMedicalEvent(medicalEventId)
      .then((medicalEvent) => {
        if (!mounted) return
        setResult({ status: 'ready', medicalEvent, message: '' })
      })
      .catch((error) => {
        if (!mounted) return
        setResult({ status: 'error', medicalEvent: null, message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [medicalEventId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, medicalEvent, message } = result
  const backLink = <Link to="/pets">Volver a mascotas</Link>
  const petPath = medicalEvent?.pet?.id ? `/pets/${medicalEvent.pet.id}/medical-events` : null

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteMedicalEvent(medicalEventId)
      navigate(petPath ?? '/pets', {
        state: { deleted: medicalEventTypeLabel(medicalEvent.type) },
      })
    } catch (error) {
      setDeleting(false)
      setConfirmingDelete(false)
      setDeleteError({ message: error.message, status: error.status })
    }
  }

  if (status === 'loading') {
    return <ScreenState state="loading" />
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message={message} />
        <div className={styles.toolbar}>
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
          <span className={styles.backLink}>{backLink}</span>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Evento médico</p>
        <h1 className={styles.title}>{medicalEventTypeLabel(medicalEvent.type)}</h1>
        <p className={styles.subtitle}>
          <time dateTime={medicalEvent.date}>{formatDay(medicalEvent.date)}</time>
        </p>
      </header>

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Mascota</dt>
          <dd>
            {petPath ? (
              <Link to={petPath}>{petSummary(medicalEvent.pet)}</Link>
            ) : (
              'Mascota no registrada'
            )}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Veterinario</dt>
          <dd>{veterinarianName(medicalEvent.veterinarian)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Descripción</dt>
          <dd className={styles.description}>{medicalEvent.description}</dd>
        </div>
      </dl>

      <div className={styles.toolbar}>
        {canManage && (
          <>
            <Link to={`/medical-events/${medicalEvent.id}/edit`} className={styles.editLink}>
              Editar evento
            </Link>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => setConfirmingDelete(true)}
            >
              Eliminar evento
            </button>
          </>
        )}
        {petPath ? (
          <Link to={petPath} className={styles.backLink}>
            Volver a la historia médica
          </Link>
        ) : (
          <span className={styles.backLink}>{backLink}</span>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="¿Eliminar este evento médico?"
          message={`El evento de ${medicalEventTypeLabel(medicalEvent.type)} del ${formatDay(medicalEvent.date)} se borrará de la historia médica${medicalEvent.pet ? ` de ${medicalEvent.pet.name}` : ''}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar evento"
          pendingLabel="Eliminando..."
          pending={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {deleteError && (
        <ErrorDialog
          title="No se pudo eliminar el evento médico"
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
