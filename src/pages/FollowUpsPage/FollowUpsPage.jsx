import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FollowUpCard from '../../components/FollowUpCard/FollowUpCard'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getFollowUps } from '../../services/followUpService'
import { sortByDateDesc } from '../../utils/followUpDates'
import styles from './FollowUpsPage.module.css'

const READER_ROLES = [ROLES.SHELTER_ADMIN, ROLES.VETERINARIAN, ROLES.ADOPTER]

// Lists the follow-ups of one adoption, most recent date first. Only the
// veterinarian gets the action to register a new follow-up (HU48 adds the
// read-only view for the adopter).
export default function FollowUpsPage() {
  const { adoptionId } = useParams()
  const { role } = getSession()
  const canRead = READER_ROLES.includes(role)
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
              message="Esta adopción aún no tiene seguimientos registrados."
            />
          )}
          {status === 'ready' && followUps.length > 0 && (
            <ul className={styles.list} aria-label="Lista de seguimientos">
              {followUps.map((followUp) => (
                <FollowUpCard key={followUp.id} followUp={followUp} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
