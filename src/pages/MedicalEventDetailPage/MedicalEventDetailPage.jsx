import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getMedicalEvent } from '../../services/medicalEventService'
import { formatDay } from '../../utils/dates'
import { medicalEventTypeLabel, petSummary, veterinarianName } from '../../utils/medicalEvents'
import styles from './MedicalEventDetailPage.module.css'

export default function MedicalEventDetailPage() {
  const { medicalEventId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', medicalEvent: null, message: '' })

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

  const petPath = medicalEvent.pet?.id ? `/pets/${medicalEvent.pet.id}/medical-events` : null

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
        <Link
          to={`/medical-events/${medicalEvent.id}/edit`}
          className={styles.editLink}
        >
          Editar evento
        </Link>
        {petPath ? (
          <Link to={petPath} className={styles.backLink}>
            Volver a la historia médica
          </Link>
        ) : (
          <span className={styles.backLink}>{backLink}</span>
        )}
      </div>
    </section>
  )
}
