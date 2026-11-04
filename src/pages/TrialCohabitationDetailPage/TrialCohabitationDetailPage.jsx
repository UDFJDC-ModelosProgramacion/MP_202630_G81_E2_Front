import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getTrialCohabitationRequest } from '../../services/trialCohabitationService'
import { durationInDays, formatDay } from '../../utils/dates'
import { canViewTrialRequest, trialRequestStatusLabel } from '../../utils/trialCohabitation'
import styles from './TrialCohabitationDetailPage.module.css'

const dayOf = (value) => String(value ?? '').slice(0, 10)

const daysLabel = (days) => `${days} ${days === 1 ? 'día' : 'días'}`

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

export default function TrialCohabitationDetailPage() {
  const { requestId } = useParams()
  const session = getSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', request: null, message: '' })

  useEffect(() => {
    let mounted = true
    getTrialCohabitationRequest(requestId)
      .then((request) => {
        if (mounted) setResult({ status: 'ready', request, message: '' })
      })
      .catch((error) => {
        if (mounted) setResult({ status: 'error', request: null, message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [requestId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, request, message } = result
  const isShelter = session.role === ROLES.SHELTER_ADMIN
  const backPath = isShelter ? '/trial-cohabitation-requests/received' : '/trial-cohabitation-requests'
  const backLabel = isShelter ? 'Volver a las solicitudes recibidas' : 'Volver a mis solicitudes'
  const backLink = (
    <Link to={backPath} className={styles.backLink}>
      {backLabel}
    </Link>
  )

  if (status === 'loading') {
    return <ScreenState state="loading" message="Cargando la solicitud..." />
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

  if (!canViewTrialRequest(request, session)) {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message="No tienes acceso a esta solicitud de convivencia de prueba."
        />
        <div className={styles.toolbar}>{backLink}</div>
      </section>
    )
  }

  const days = durationInDays(dayOf(request.startDate), dayOf(request.endDate))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Solicitud de convivencia de prueba</p>
        <h1 className={styles.title}>
          {request.pet?.name} — {request.pet?.species}
        </h1>
        <span className={styles.status} data-status={request.status}>
          {trialRequestStatusLabel(request.status)}
        </span>
      </header>

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Adoptante</dt>
          <dd>{adopterName(request.adopter)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Contacto</dt>
          <dd>{`${request.adopter?.email ?? ''} · ${request.adopter?.phone ?? ''}`}</dd>
        </div>
        <div className={styles.row}>
          <dt>Refugio</dt>
          <dd>{request.shelter?.name ?? `#${request.shelter?.id}`}</dd>
        </div>
        <div className={styles.row}>
          <dt>Periodo</dt>
          <dd>
            <time dateTime={dayOf(request.startDate)}>{formatDay(request.startDate)}</time>
            {' – '}
            <time dateTime={dayOf(request.endDate)}>{formatDay(request.endDate)}</time>
            {days && <span className={styles.duration}> ({daysLabel(days)})</span>}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Solicitada el</dt>
          <dd>{formatDay(request.date)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Descripción</dt>
          <dd className={styles.description}>{request.description}</dd>
        </div>
      </dl>

      {request.trialCohabitation && (
        <p className={styles.note}>Esta solicitud ya generó una convivencia de prueba.</p>
      )}

      <div className={styles.toolbar}>{backLink}</div>
    </section>
  )
}
