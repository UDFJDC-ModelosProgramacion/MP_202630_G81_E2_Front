import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FollowUpCard from '../../components/FollowUpCard/FollowUpCard'
import ModalDialog, {
  DialogActions,
  DialogButton,
  DialogPill,
  DialogTitle,
} from '../../components/ModalDialog/ModalDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { deleteFollowUp, getFollowUps } from '../../services/followUpService'
import { formatDay } from '../../utils/dates'
import { dayOf, isFutureDay, sortByDateDesc, statusOfDay } from '../../utils/followUpDates'
import styles from './FollowUpsPage.module.css'

const READER_ROLES = [ROLES.SHELTER_ADMIN, ROLES.VETERINARIAN, ROLES.ADOPTER]

const DELETE_DISABLED_HINT =
  'Los seguimientos con fecha vencida preservan el historial del refugio y no se pueden eliminar.'

// Nearest pending follow-up of the adopter. When every date already passed, the
// most recent one is highlighted as overdue.
function nextCheckUp(followUps) {
  const pending = followUps
    .filter((followUp) => statusOfDay(followUp.date) !== 'past')
    .sort((a, b) => dayOf(a.date).localeCompare(dayOf(b.date)))
  if (pending.length > 0) return { followUp: pending[0], overdue: false }
  const past = sortByDateDesc(followUps)
  return past.length > 0 ? { followUp: past[0], overdue: true } : null
}

// Lists the follow-ups of one adoption, most recent date first. The veterinarian
// gets register (HU46), edit (HU49) and delete (HU50) actions; delete is only
// enabled for future dates because the backend keeps past follow-ups as shelter
// history. The adopter reads them with the nearest check-up highlighted (HU48).
// The backend does not validate ownership of the list, so any reader role can
// open it by URL.
export default function FollowUpsPage() {
  const { adoptionId } = useParams()
  const { role } = getSession()
  const canRead = READER_ROLES.includes(role)
  const isAdopter = role === ROLES.ADOPTER
  const canRegister = role === ROLES.VETERINARIAN
  const [result, setResult] = useState({ status: 'loading', followUps: [], message: '' })
  const [confirming, setConfirming] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(null)
  const [errorDialog, setErrorDialog] = useState(null)

  useEffect(() => {
    if (!canRead) return undefined
    let active = true
    getFollowUps(adoptionId)
      .then((followUps) => {
        if (!active) return
        setResult({ status: 'ready', followUps: sortByDateDesc(followUps), message: '' })
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', followUps: [], message: error.message })
      })
    return () => {
      active = false
    }
  }, [canRead, adoptionId])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteFollowUp(adoptionId, confirming.id)
      const removed = confirming
      setConfirming(null)
      setDeleted(removed)
      setResult((current) => ({
        ...current,
        followUps: current.followUps.filter((followUp) => followUp.id !== removed.id),
      }))
    } catch (error) {
      setConfirming(null)
      setErrorDialog({ message: error.message, status: error.status })
    }
    setDeleting(false)
  }

  function cardActions(followUp) {
    if (!canRegister) return null
    const deletable = isFutureDay(followUp.date)
    return (
      <>
        <Link
          className={styles.edit}
          to={`/adoptions/${adoptionId}/followUps/${followUp.id}/edit`}
        >
          Editar
        </Link>
        <button
          type="button"
          className={styles.delete}
          disabled={!deletable}
          title={deletable ? undefined : DELETE_DISABLED_HINT}
          onClick={() => setConfirming(followUp)}
        >
          Eliminar
        </button>
      </>
    )
  }

  const { status, followUps, message } = result
  const nextCheck = isAdopter && status === 'ready' ? nextCheckUp(followUps) : null

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Seguimientos de la adopción</h1>
          <p className={styles.subtitle}>Adopción #{adoptionId}</p>
        </div>
        {canRead && canRegister && (
          <Link className={styles.new} to={`/adoptions/${adoptionId}/followUps/new`}>
            Registrar seguimiento
          </Link>
        )}
      </div>

      {!canRead ? (
        <ScreenState
          state="error"
          message="Solo el personal del refugio y el adoptante pueden consultar los seguimientos."
        />
      ) : (
        <>
          {status === 'loading' && <ScreenState state="loading" />}
          {status === 'error' && <ScreenState state="error" message={message} />}
          {status === 'ready' && followUps.length === 0 && (
            <ScreenState
              state="empty"
              message={
                isAdopter
                  ? 'Tu mascota aún no tiene seguimientos registrados.'
                  : 'Esta adopción aún no tiene seguimientos registrados.'
              }
            />
          )}
          {nextCheck && (
            <div
              className={`${styles.nextCheck} ${nextCheck.overdue ? styles.nextCheckOverdue : ''}`.trim()}
              role="status"
            >
              <p className={styles.nextCheckTitle}>
                {nextCheck.overdue ? 'Control vencido' : 'Próximo control'}:{' '}
                {formatDay(nextCheck.followUp.date)}
              </p>
              <p className={styles.nextCheckObservation}>{nextCheck.followUp.observation}</p>
            </div>
          )}
          {deleted && (
            <p className={styles.deleted} role="status">
              El seguimiento del {formatDay(deleted.date)} fue eliminado.
            </p>
          )}
          {status === 'ready' && followUps.length > 0 && (
            <ul className={styles.list} aria-label="Lista de seguimientos">
              {followUps.map((followUp) => (
                <FollowUpCard
                  key={followUp.id}
                  followUp={followUp}
                  actions={cardActions(followUp)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {confirming && (
        <ModalDialog
          tone="error"
          role="alertdialog"
          labelledBy="delete-confirm-title"
          describedBy="delete-confirm-message"
          onClose={() => setConfirming(null)}
        >
          <DialogPill>Acción irreversible</DialogPill>
          <DialogTitle id="delete-confirm-title">Eliminar seguimiento</DialogTitle>
          <p id="delete-confirm-message">
            ¿Seguro que desea eliminar el seguimiento del {formatDay(confirming.date)}? Esta acción
            no se puede deshacer.
          </p>
          <DialogActions>
            <DialogButton onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </DialogButton>
            <DialogButton variant="secondary" onClick={() => setConfirming(null)}>
              Cancelar
            </DialogButton>
          </DialogActions>
        </ModalDialog>
      )}

      {errorDialog && (
        <ErrorDialog
          title="Error al eliminar el seguimiento"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={DELETE_DISABLED_HINT}
          actionLabel="Entendido"
          onClose={() => setErrorDialog(null)}
        />
      )}
    </section>
  )
}
