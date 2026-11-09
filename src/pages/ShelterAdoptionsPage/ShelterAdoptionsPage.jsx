import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { ADOPTION_STATUSES } from '../../constants/adoptionOptions'
import { getSession, ROLES } from '../../config/roleSession'
import { getAdoptions } from '../../services/adoptionService'
import { getPets } from '../../services/petService'
import { adoptionStatusLabel } from '../../utils/adoptions'
import { formatDay, sortByDateDescending } from '../../utils/dates'
import styles from './ShelterAdoptionsPage.module.css'

const NO_FILTERS = { petId: '', status: '' }

const hasFilters = (filters) => Object.values(filters).some((value) => value !== '')

const dayOf = (value) => String(value ?? '').slice(0, 10)

const petLabel = (pet) => `${pet.name} — ${pet.species}`

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

function ShelterAdoptions({ shelterId }) {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pets, setPets] = useState([])
  const [result, setResult] = useState({
    status: 'loading',
    adoptions: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  useEffect(() => {
    const requestId = ++lastRequest.current
    Promise.all([getPets(), getAdoptions({ shelterId })])
      .then(([allPets, adoptions]) => {
        if (requestId !== lastRequest.current) return
        setPets(allPets.filter((pet) => pet.shelter?.id === shelterId))
        setResult({
          status: 'ready',
          adoptions: sortByDateDescending(adoptions),
          filtered: false,
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({ status: 'error', adoptions: [], filtered: false, message: error.message })
      })
  }, [shelterId])

  // Only the answer to the latest search is shown, so a slow older answer never overwrites it.
  function search(appliedFilters) {
    const requestId = ++lastRequest.current
    setResult((current) => ({ ...current, status: 'loading' }))
    getAdoptions({ shelterId, petId: appliedFilters.petId, status: appliedFilters.status })
      .then((adoptions) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'ready',
          adoptions: sortByDateDescending(adoptions),
          filtered: hasFilters(appliedFilters),
          message: '',
        })
      })
      .catch((error) => {
        if (requestId !== lastRequest.current) return
        setResult({
          status: 'error',
          adoptions: [],
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

  const { status, adoptions, filtered, message } = result
  const emptyMessage =
    pets.length === 0
      ? 'Tu refugio aún no tiene mascotas registradas.'
      : filtered
        ? 'No hay adopciones que coincidan con los filtros indicados.'
        : 'Tu refugio aún no tiene adopciones registradas.'

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Adopciones de mi refugio</h1>
      <p className={styles.subtitle}>
        Consulta las adopciones de las mascotas de tu refugio y filtra por mascota o estado.
      </p>

      <form
        className={styles.filters}
        onSubmit={handleSubmit}
        aria-label="Filtros de adopciones del refugio"
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
            {ADOPTION_STATUSES.map(({ value, label }) => (
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
      {status === 'ready' && adoptions.length === 0 && (
        <ScreenState state="empty" message={emptyMessage} />
      )}

      {status === 'ready' && adoptions.length > 0 && (
        <ul className={styles.list} aria-label="Adopciones del refugio">
          {adoptions.map((adoption) => (
            <li key={adoption.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.pet}>
                  {adoption.pet?.name} — {adoption.pet?.species}
                </h2>
                <span className={styles.status} data-status={adoption.status}>
                  {adoptionStatusLabel(adoption.status)}
                </span>
              </div>
              <p>Adoptante: {adopterName(adoption.adopter)}</p>
              <p className={styles.date}>
                Fecha de la adopción:{' '}
                <time dateTime={dayOf(adoption.date)}>{formatDay(adoption.date)}</time>
              </p>
              <p className={styles.notes}>Notas importantes: {adoption.importantNotes}</p>
              <Link
                to={`/adoptions/${adoption.id}`}
                className={styles.detailLink}
                aria-label={`Ver detalle de la adopción de ${adoption.pet?.name} por ${adopterName(adoption.adopter)}`}
              >
                Ver detalle
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ShelterAdoptionsPage() {
  const session = getSession()

  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>Adopciones de mi refugio</h1>
        <ScreenState
          state="error"
          message="Solo el personal del refugio puede consultar las adopciones del refugio."
        />
      </section>
    )
  }

  return <ShelterAdoptions shelterId={session.shelterId} />
}
