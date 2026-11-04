import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getMedicalEvents } from '../../services/medicalEventService'
import { getPet } from '../../services/petService'
import { formatDay } from '../../utils/dates'
import {
  medicalEventTypeLabel,
  sortByDateDescending,
  veterinarianName,
} from '../../utils/medicalEvents'
import styles from './MedicalEventHistoryPage.module.css'

export default function MedicalEventHistoryPage() {
  const { petId } = useParams()
  const { state } = useLocation()
  const deleted = state?.deleted
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    status: 'loading',
    pet: null,
    events: [],
    message: '',
  })

  useEffect(() => {
    let mounted = true
    Promise.all([getPet(petId), getMedicalEvents({ petId })])
      .then(([pet, events]) => {
        if (!mounted) return
        setResult({ status: 'ready', pet, events: sortByDateDescending(events), message: '' })
      })
      .catch((error) => {
        if (!mounted) return
        setResult({ status: 'error', pet: null, events: [], message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [petId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, pet, events, message } = result
  const subtitle = pet
    ? `${pet.name} — ${pet.species}${pet.breed ? ` · ${pet.breed}` : ''}`
    : 'Eventos médicos registrados para la mascota.'

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Historia médica</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {deleted && (
        <p role="status" className={styles.notice}>
          Se eliminó el evento médico de {deleted}.
        </p>
      )}

      <div className={styles.toolbar}>
        <Link to="/medical-events/new" className={styles.linkButton}>
          Registrar evento médico
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

      {status === 'ready' && events.length === 0 && (
        <ScreenState
          state="empty"
          message={`${pet.name} aún no tiene eventos médicos registrados.`}
        />
      )}

      {status === 'ready' && events.length > 0 && (
        <ul className={styles.list} aria-label="Eventos médicos">
          {events.map((event, index) => (
            <li key={event.id ?? `${event.date}-${index}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.type}>
                  <Link
                    to={`/medical-events/${event.id}`}
                    className={styles.cardLink}
                    aria-label={`Ver detalle de ${medicalEventTypeLabel(event.type)}`}
                  >
                    {medicalEventTypeLabel(event.type)}
                  </Link>
                </h2>
                <time className={styles.date} dateTime={event.date}>
                  {formatDay(event.date)}
                </time>
              </div>
              <p className={styles.description}>{event.description}</p>
              <p className={styles.veterinarian}>{veterinarianName(event.veterinarian)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
