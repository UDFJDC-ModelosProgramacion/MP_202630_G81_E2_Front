import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { TRIAL_REQUEST_STATUSES } from '../../constants/trialCohabitationOptions'
import { getSession, ROLES } from '../../config/roleSession'
import { getPets } from '../../services/petService'
import { getTrialCohabitationRequests } from '../../services/trialCohabitationService'
import { durationInDays, formatDay, sortByDateDescending } from '../../utils/dates'
import { trialRequestStatusLabel } from '../../utils/trialCohabitation'
import styles from './TrialCohabitationReceivedPage.module.css'

const NO_FILTERS = { petId: '', status: '' }

const hasFilters = (filters) => Object.values(filters).some((value) => value !== '')

const dayOf = (value) => String(value ?? '').slice(0, 10)

const daysLabel = (days) => `${days} ${days === 1 ? 'día' : 'días'}`

const petLabel = (pet) => `${pet.name} — ${pet.species}`

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

// One query per pet of the shelter: the requests of other shelters are never loaded.
function fetchRequests(shelterPets, applied) {
  const targets = applied.petId
    ? shelterPets.filter((pet) => String(pet.id) === applied.petId)
    : shelterPets
  return Promise.all(
    targets.map((pet) => getTrialCohabitationRequests({ petId: pet.id, status: applied.status })),
  ).then((lists) => lists.flat())
}

function ReceivedRequests({ shelterId }) {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pets, setPets] = useState([])
  const [result, setResult] = useState({
    status: 'loading',
    requests: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  useEffect(() => {
    const requestId = ++lastRequest.current
    getPets()
      .then((allPets) => {
        const shelterPets = allPets.filter((pet) => pet.shelter?.id === shelterId)
        return fetchRequests(shelterPets, NO_FILTERS).then((requests) => ({ shelterPets, requests }))
      })
      .then(({ shelterPets, requests }) => {
        if (requestId !== lastRequest.current) return
        setPets(shelterPets)
        setResult({
          status: 'ready',
          requests: sortByDateDescending(requests),
          filtered: false,
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({ status: 'error', requests: [], filtered: false, message: error.message })
      })
  }, [shelterId])

  // Only the answer to the latest search is shown, so a slow older answer never overwrites it.
  function search(appliedFilters) {
    const requestId = ++lastRequest.current
    setResult((current) => ({ ...current, status: 'loading' }))
    fetchRequests(pets, appliedFilters)
      .then((requests) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'ready',
          requests: sortByDateDescending(requests),
          filtered: hasFilters(appliedFilters),
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'error',
          requests: [],
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

  const { status, requests, filtered, message } = result
  const emptyMessage =
    pets.length === 0
      ? 'Tu refugio aún no tiene mascotas registradas.'
      : filtered
        ? 'No hay solicitudes que coincidan con los filtros indicados.'
        : 'Tu refugio aún no tiene solicitudes de convivencia de prueba.'

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Solicitudes de convivencia recibidas</h1>
      <p className={styles.subtitle}>
        Consulta las solicitudes de convivencia de prueba de las mascotas de tu refugio y filtra
        por mascota o estado.
      </p>

      <form
        className={styles.filters}
        onSubmit={handleSubmit}
        aria-label="Filtros de solicitudes recibidas"
      >
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
          <label htmlFor="status">Estado</label>
          <select id="status" name="status" value={filters.status} onChange={handleChange}>
            <option value="">Todos</option>
            {TRIAL_REQUEST_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
      {status === 'ready' && requests.length === 0 && (
        <ScreenState state="empty" message={emptyMessage} />
      )}

      {status === 'ready' && requests.length > 0 && (
        <ul className={styles.list} aria-label="Solicitudes de convivencia recibidas">
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
                <p className={styles.adopter}>Adoptante: {adopterName(request.adopter)}</p>
                <p className={styles.contact}>
                  {`${request.adopter?.email ?? ''} · ${request.adopter?.phone ?? ''}`}
                </p>
                <p className={styles.period}>
                  <time dateTime={dayOf(request.startDate)}>{formatDay(request.startDate)}</time>
                  {' – '}
                  <time dateTime={dayOf(request.endDate)}>{formatDay(request.endDate)}</time>
                  {days && <span className={styles.duration}> ({daysLabel(days)})</span>}
                </p>
                <p className={styles.description}>{request.description}</p>
                <p className={styles.requestedOn}>Solicitada el {formatDay(request.date)}</p>
                <Link
                  to={`/trial-cohabitation-requests/${request.id}`}
                  className={styles.detailLink}
                  aria-label={`Ver detalle de la solicitud de ${request.pet?.name}`}
                >
                  Ver detalle
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function TrialCohabitationReceivedPage() {
  const session = getSession()

  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>Solicitudes de convivencia recibidas</h1>
        <ScreenState
          state="error"
          message="Solo el personal del refugio puede ver las solicitudes recibidas."
        />
      </section>
    )
  }

  return <ReceivedRequests shelterId={session.shelterId} />
}
