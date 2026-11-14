import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { MEDICAL_EVENT_TYPES } from '../../constants/medicalEventOptions'
import { getMedicalEvents } from '../../services/medicalEventService'
import { getPet } from '../../services/petService'
import { formatDay } from '../../utils/dates'
import styles from './MedicalEventHistoryPage.module.css'

const typeLabel = (value) =>
  MEDICAL_EVENT_TYPES.find((option) => option.value === value)?.label ?? value ?? 'Evento médico'

const veterinarianName = (veterinarian) => {
  if (!veterinarian) return 'Sin veterinario asignado'
  const name = `Dr(a). ${veterinarian.firstName ?? ''} ${veterinarian.lastName ?? ''}`.trim()
  return name === 'Dr(a).' ? 'Sin veterinario asignado' : name
}

const byDateDescending = (events) =>
  [...events].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))

export default function MedicalEventHistoryPage() {
  const { petId } = useParams()
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
        setResult({ status: 'ready', pet, events: byDateDescending(events), message: '' })
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
                <h2 className={styles.type}>{typeLabel(event.type)}</h2>
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
