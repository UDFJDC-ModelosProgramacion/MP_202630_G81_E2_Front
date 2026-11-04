import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getTrialCohabitationRequests } from '../../services/trialCohabitationService'
import { durationInDays, formatDay, sortByDateDescending } from '../../utils/dates'
import { trialRequestStatusLabel } from '../../utils/trialCohabitation'
import styles from './TrialCohabitationListPage.module.css'

const dayOf = (value) => String(value ?? '').slice(0, 10)

const daysLabel = (days) => `${days} ${days === 1 ? 'día' : 'días'}`

function RequestsList({ adopterId }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', requests: [], message: '' })

  useEffect(() => {
    let mounted = true
    getTrialCohabitationRequests({ adopterId })
      .then((requests) => {
        if (!mounted) return
        setResult({ status: 'ready', requests: sortByDateDescending(requests), message: '' })
      })
      .catch((error) => {
        if (!mounted) return
        setResult({ status: 'error', requests: [], message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [adopterId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, requests, message } = result

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Mis solicitudes de convivencia</h1>
      <p className={styles.subtitle}>
        Consulta el estado de las solicitudes de convivencia de prueba que has enviado.
      </p>

      <div className={styles.toolbar}>
        <Link to="/trial-cohabitation-requests/new" className={styles.newRequest}>
          Nueva solicitud
        </Link>
      </div>

      {status === 'loading' && <ScreenState state="loading" />}

      {status === 'error' && (
        <>
          <ScreenState state="error" message={message} />
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      {status === 'ready' && requests.length === 0 && (
        <ScreenState
          state="empty"
          message="Aún no has enviado solicitudes de convivencia de prueba."
        />
      )}

      {status === 'ready' && requests.length > 0 && (
        <ul className={styles.list} aria-label="Mis solicitudes de convivencia">
          {requests.map((request) => {
            const days = durationInDays(dayOf(request.startDate), dayOf(request.endDate))
            return (
              <li key={request.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.pet}>
                    {request.pet?.name} — {request.pet?.species}
                  </h2>
                  <span className={styles.status} data-status={request.status}>
                    {trialRequestStatusLabel(request.status)}
                  </span>
                </div>
                <p className={styles.period}>
                  <time dateTime={dayOf(request.startDate)}>{formatDay(request.startDate)}</time>
                  {' – '}
                  <time dateTime={dayOf(request.endDate)}>{formatDay(request.endDate)}</time>
                  {days && <span className={styles.duration}> ({daysLabel(days)})</span>}
                </p>
                <p>Refugio: {request.shelter?.name}</p>
                <p className={styles.description}>{request.description}</p>
                <p className={styles.requestedOn}>Solicitada el {formatDay(request.date)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function TrialCohabitationListPage() {
  const session = getSession()

  if (session.role !== ROLES.ADOPTER) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>Mis solicitudes de convivencia</h1>
        <ScreenState
          state="error"
          message="Solo los adoptantes pueden consultar sus solicitudes de convivencia."
        />
      </section>
    )
  }

  return <RequestsList adopterId={session.userId} />
}
