import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/roleSession'
import {
  getTrialCohabitationRequest,
  updateTrialCohabitationRequest,
} from '../../services/trialCohabitationService'
import { durationInDays, formatDay } from '../../utils/dates'
import {
  buildDecisionPayload,
  canViewTrialRequest,
  isPendingRequest,
  trialRequestStatusLabel,
} from '../../utils/trialCohabitation'
import styles from './TrialCohabitationDetailPage.module.css'

const DECISIONS = {
  APPROVED: {
    question: '¿Aprobar esta solicitud?',
    button: 'Aprobar solicitud',
    outcome: 'quedará aprobada',
    past: 'aprobada',
    done: '¡Solicitud aprobada con éxito!',
  },
  REJECTED: {
    question: '¿Rechazar esta solicitud?',
    button: 'Rechazar solicitud',
    outcome: 'quedará rechazada',
    past: 'rechazada',
    done: '¡Solicitud rechazada con éxito!',
  },
}

const DECISION_HINT =
  'Verifique la solicitud antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const dayOf = (value) => String(value ?? '').slice(0, 10)

const daysLabel = (days) => `${days} ${days === 1 ? 'día' : 'días'}`

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

export default function TrialCohabitationDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const session = getSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', request: null, message: '' })
  const [decision, setDecision] = useState(null)
  const [deciding, setDeciding] = useState(false)
  const [decisionError, setDecisionError] = useState(null)
  const [decided, setDecided] = useState(null)

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

  async function handleDecision() {
    setDeciding(true)
    try {
      const saved = await updateTrialCohabitationRequest(
        requestId,
        buildDecisionPayload(result.request, decision),
      )
      setResult((current) => ({
        ...current,
        request: { ...current.request, status: saved?.status ?? decision },
      }))
      setDecided(decision)
    } catch (error) {
      setDecisionError({ message: error.message, status: error.status })
    }
    setDeciding(false)
    setDecision(null)
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
  const canDecide = isShelter && isPendingRequest(request)
  const petName = request.pet?.name
  const adopter = adopterName(request.adopter)

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
          <dd>{adopter}</dd>
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

      {canDecide && (
        <div className={styles.decisions}>
          <button type="button" className={styles.approve} onClick={() => setDecision('APPROVED')}>
            {DECISIONS.APPROVED.button}
          </button>
          <button type="button" className={styles.reject} onClick={() => setDecision('REJECTED')}>
            {DECISIONS.REJECTED.button}
          </button>
        </div>
      )}

      <div className={styles.toolbar}>{backLink}</div>

      {decision && (
        <ConfirmDialog
          title={DECISIONS[decision].question}
          message={`La solicitud de ${petName} de ${adopter} ${DECISIONS[decision].outcome}. Una solicitud finalizada no se puede modificar después.`}
          confirmLabel={DECISIONS[decision].button}
          pendingLabel="Guardando..."
          pending={deciding}
          onConfirm={handleDecision}
          onCancel={() => setDecision(null)}
        />
      )}

      {decisionError && (
        <ErrorDialog
          title="No se pudo guardar la decisión"
          message={decisionError.message}
          status={decisionError.status}
          hint={DECISION_HINT}
          actionLabel="Cerrar"
          onClose={() => setDecisionError(null)}
        />
      )}

      {decided && (
        <SuccessDialog
          title={DECISIONS[decided].done}
          message={`La solicitud de ${petName} de ${adopter} quedó ${DECISIONS[decided].past}.`}
          details={[{ label: 'Estado', value: trialRequestStatusLabel(decided) }]}
          statusLabel="Código HTTP 200 • Actualizada con éxito"
          actionLabel="Volver a las solicitudes recibidas"
          closeLabel="Quedarme en el detalle"
          onAction={() => navigate('/trial-cohabitation-requests/received')}
          onClose={() => setDecided(null)}
        />
      )}
    </section>
  )
}
