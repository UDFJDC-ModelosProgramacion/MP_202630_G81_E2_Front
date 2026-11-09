import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { MEDICAL_EVENT_TYPES } from '../../constants/medicalEventOptions'
import { getMedicalEvents } from '../../services/medicalEventService'
import { getPets } from '../../services/petService'
import { formatDay, sortByDateDescending } from '../../utils/dates'
import { medicalEventTypeLabel, petSummary, veterinarianName } from '../../utils/medicalEvents'
import styles from './MedicalEventsPage.module.css'

const NO_FILTERS = { petId: '', type: '', date: '' }

const hasFilters = (filters) => Object.values(filters).some((value) => value !== '')

const petLabel = (pet) => `${pet.name} — ${pet.species}`

export default function MedicalEventsPage() {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pets, setPets] = useState([])
  const [result, setResult] = useState({
    status: 'loading',
    events: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  useEffect(() => {
    const requestId = ++lastRequest.current
    Promise.all([getPets(), getMedicalEvents(NO_FILTERS)])
      .then(([allPets, events]) => {
        if (requestId !== lastRequest.current) return
        setPets(allPets)
        setResult({
          status: 'ready',
          events: sortByDateDescending(events),
          filtered: false,
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({ status: 'error', events: [], filtered: false, message: error.message })
      })
  }, [])

  // Only the answer to the latest search is shown, so a slow older answer never overwrites it.
  function search(appliedFilters) {
    const requestId = ++lastRequest.current
    setResult((current) => ({ ...current, status: 'loading' }))
    getMedicalEvents(appliedFilters)
      .then((events) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'ready',
          events: sortByDateDescending(events),
          filtered: hasFilters(appliedFilters),
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'error',
          events: [],
          filtered: hasFilters(appliedFilters),
          message: error.message,
        })
      })
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    search(filters)
  }

  function clearFilters() {
    setFilters(NO_FILTERS)
    search(NO_FILTERS)
  }

  const { status, events, filtered, message } = result

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Eventos médicos</h1>
      <p className={styles.subtitle}>
        Consulta los eventos médicos registrados y filtra por mascota, tipo o fecha.
      </p>

      <div className={styles.toolbar}>
        <Link to="/medical-events/new" className={styles.register}>
          Registrar evento médico
        </Link>
      </div>

      <form className={styles.filters} onSubmit={handleSubmit} aria-label="Filtros de eventos médicos">
        <div className={styles.field}>
          <label htmlFor="petId">Mascota</label>
          <select id="petId" name="petId" value={filters.petId} onChange={handleChange}>
            <option value="">Todas</option>
            {pets.map((pet) => (
              <option key={pet.id} value={String(pet.id)}>
                {petLabel(pet)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="type">Tipo de evento</label>
          <select id="type" name="type" value={filters.type} onChange={handleChange}>
            <option value="">Todos</option>
            {MEDICAL_EVENT_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="date">Fecha del evento</label>
          <input id="date" name="date" type="date" value={filters.date} onChange={handleChange} />
        </div>

        <button type="submit" className={styles.search}>
          Buscar
        </button>
        <button type="button" className={styles.clear} onClick={clearFilters}>
          Limpiar filtros
        </button>
      </form>

      {status === 'loading' && <ScreenState state="loading" />}
      {status === 'error' && <ScreenState state="error" message={message} />}
      {status === 'ready' && events.length === 0 && (
        <ScreenState
          state="empty"
          message={
            filtered
              ? 'No hay eventos médicos que coincidan con los filtros indicados.'
              : 'Aún no hay eventos médicos registrados.'
          }
        />
      )}
      {status === 'ready' && events.length > 0 && (
        <ul className={styles.list} aria-label="Lista de eventos médicos">
          {events.map((event) => (
            <li key={event.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.type}>
                  <Link
                    to={`/medical-events/${event.id}`}
                    aria-label={`Ver detalle de ${medicalEventTypeLabel(event.type)}`}
                  >
                    {medicalEventTypeLabel(event.type)}
                  </Link>
                </h2>
                <time className={styles.date} dateTime={event.date}>
                  {formatDay(event.date)}
                </time>
              </div>
              <p className={styles.pet}>{petSummary(event.pet)}</p>
              <p className={styles.description}>{event.description}</p>
              <p className={styles.veterinarian}>{veterinarianName(event.veterinarian)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
