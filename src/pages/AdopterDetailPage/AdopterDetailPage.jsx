import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/adopterSession'
import { getAdopter } from '../../services/adopterService'
import { formatDay } from '../../utils/dates'
import styles from './AdopterDetailPage.module.css'

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  FINALIZED: 'Finalizada',
}

const statusLabel = (status) => STATUS_LABELS[status] ?? status ?? '—'

const yesNo = (value) => {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  return '—'
}

const text = (value) => (value == null || value === '' ? '—' : value)

export default function AdopterDetailPage() {
  const { adopterId } = useParams()
  const isAdmin = getSession().role === ROLES.SHELTER_ADMIN
  const [result, setResult] = useState({ status: 'loading', adopter: null, message: '' })

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    getAdopter(adopterId)
      .then((adopter) => {
        if (!cancelled) setResult({ status: 'ready', adopter, message: '' })
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', adopter: null, message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [adopterId, isAdmin])

  const backLink = (
    <Link to="/adopters" className={styles.back}>
      Volver al listado
    </Link>
  )

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Detalle del adoptante</h1>
        <ScreenState
          state="error"
          message="Solo el administrador del refugio puede consultar el detalle del adoptante."
        />
      </section>
    )
  }

  const { status, adopter, message } = result

  if (status === 'loading') {
    return <ScreenState state="loading" />
  }

  if (status === 'error') {
    return (
      <>
        <ScreenState state="error" message={message} />
        {backLink}
      </>
    )
  }

  const history = adopter.trialCohabitions ?? []

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>
        {adopter.firstName} {adopter.lastName}
      </h1>

      <section className={styles.section} aria-label="Datos personales">
        <h2>Datos personales</h2>
        <dl className={styles.grid}>
          <div>
            <dt>Cédula</dt>
            <dd>{text(adopter.nationalId)}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{text(adopter.email)}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{text(adopter.phone)}</dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>{text(adopter.address)}</dd>
          </div>
          <div>
            <dt>Ocupación</dt>
            <dd>{text(adopter.occupation)}</dd>
          </div>
          <div>
            <dt>Ingresos</dt>
            <dd>{text(adopter.earnings)}</dd>
          </div>
          <div>
            <dt>Vivienda</dt>
            <dd>{text(adopter.housingType)}</dd>
          </div>
          <div>
            <dt>Alergias</dt>
            <dd>{text(adopter.allergies)}</dd>
          </div>
          <div>
            <dt>Hijos</dt>
            <dd>{yesNo(adopter.hasChildren)}</dd>
          </div>
          <div>
            <dt>Otras mascotas</dt>
            <dd>{yesNo(adopter.hasOtherPets)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-label="Historial de convivencias">
        <h2>Historial de convivencias</h2>
        {history.length === 0 ? (
          <p className={styles.empty}>Este adoptante no tiene convivencias registradas.</p>
        ) : (
          <ul className={styles.history}>
            {history.map((trial) => (
              <li key={trial.id} className={styles.historyItem}>
                <h3>{text(trial.trialCohabitationRequest?.pet?.name)}</h3>
                <span className={styles.status}>{statusLabel(trial.status)}</span>
                <p>
                  {formatDay(trial.startDate)} — {formatDay(trial.endDate)}
                </p>
                <p>{text(trial.observations)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {backLink}
    </section>
  )
}
