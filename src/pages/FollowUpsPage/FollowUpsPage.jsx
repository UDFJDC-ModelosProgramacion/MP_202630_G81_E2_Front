import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FollowUpCard from '../../components/FollowUpCard/FollowUpCard'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getFollowUps } from '../../services/followUpService'
import { formatDay } from '../../utils/dates'
import { dayOf, sortByDateDesc, statusOfDay } from '../../utils/followUpDates'
import styles from './FollowUpsPage.module.css'

const READER_ROLES = [ROLES.SHELTER_ADMIN, ROLES.VETERINARIAN, ROLES.ADOPTER]

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

// Lists the follow-ups of one adoption, most recent date first. Only the
// veterinarian gets the action to register a new follow-up; the adopter reads
// them with the nearest check-up highlighted (HU48). The backend does not
// validate ownership of the list, so any reader role can open it by URL.
export default function FollowUpsPage() {
  const { adoptionId } = useParams()
  const { role } = getSession()
  const canRead = READER_ROLES.includes(role)
  const isAdopter = role === ROLES.ADOPTER
  const canRegister = role === ROLES.VETERINARIAN
  const [result, setResult] = useState({ status: 'loading', followUps: [], message: '' })

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
          {status === 'ready' && followUps.length > 0 && (
            <ul className={styles.list} aria-label="Lista de seguimientos">
              {followUps.map((followUp) => (
                <FollowUpCard
                  key={followUp.id}
                  followUp={followUp}
                  actions={
                    canRegister ? (
                      <Link
                        className={styles.edit}
                        to={`/adoptions/${adoptionId}/followUps/${followUp.id}/edit`}
                      >
                        Editar
                      </Link>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
