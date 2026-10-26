import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getVeterinarians } from '../../services/veterinarianService'
import styles from './VeterinariansPage.module.css'

const NO_FILTERS = { specialization: '', availability: '' }

const hasFilters = (filters) =>
  Boolean(filters.specialization.trim() || filters.availability.trim())


const distinct = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))

const initials = ({ firstName = '', lastName = '' }) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

export default function VeterinariansPage() {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [options, setOptions] = useState({ specializations: [], availabilities: [] })
  const [result, setResult] = useState({
    status: 'loading',
    veterinarians: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  
  const search = useCallback((appliedFilters) => {
    const requestId = ++lastRequest.current
    return getVeterinarians(appliedFilters)
      .then((veterinarians) => {
        if (requestId === lastRequest.current) {
          setResult({
            status: 'ready',
            veterinarians,
            filtered: hasFilters(appliedFilters),
            message: '',
          })
        }
        return veterinarians
      })
      .catch((error) => {
        if (requestId === lastRequest.current) {
          setResult({
            status: 'error',
            veterinarians: [],
            filtered: hasFilters(appliedFilters),
            message: error.message,
          })
        }
        return null
      })
  }, [])

  useEffect(() => {
    search(NO_FILTERS).then((veterinarians) => {
      if (veterinarians) {
        setOptions({
          specializations: distinct(veterinarians.map((v) => v.specialization)),
          availabilities: distinct(veterinarians.map((v) => v.availability)),
        })
      }
    })
  }, [search])

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setResult((current) => ({ ...current, status: 'loading' }))
    search(filters)
  }

  const { status, veterinarians, filtered, message } = result

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Veterinarios</h1>

      <form className={styles.filters} onSubmit={handleSubmit} aria-label="Filtros de veterinarios">
        <div className={styles.field}>
          <label htmlFor="specialization">Especialización</label>
          <select
            id="specialization"
            name="specialization"
            value={filters.specialization}
            onChange={handleChange}
          >
            <option value="">Todas</option>
            {options.specializations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="availability">Disponibilidad</label>
          <select
            id="availability"
            name="availability"
            value={filters.availability}
            onChange={handleChange}
          >
            <option value="">Todas</option>
            {options.availabilities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.search}>
          Buscar
        </button>
      </form>

      {status === 'loading' && <ScreenState state="loading" />}
      {status === 'error' && <ScreenState state="error" message={message} />}
      {status === 'ready' && veterinarians.length === 0 && (
        <ScreenState
          state="empty"
          message={
            filtered
              ? 'No se encontraron veterinarios con los filtros indicados.'
              : 'Aún no hay veterinarios registrados.'
          }
        />
      )}
      {status === 'ready' && veterinarians.length > 0 && (
        <ul className={styles.list} aria-label="Lista de veterinarios">
          {veterinarians.map((veterinarian) => (
            <li key={veterinarian.id} className={styles.card}>
              <div className={styles.header}>
                <span className={styles.avatar} aria-hidden="true">
                  {initials(veterinarian)}
                </span>
                <div>
                  <h2>Dr(a). {veterinarian.firstName}</h2>
                  <p className={styles.lastName}>{veterinarian.lastName}</p>
                </div>
              </div>
              <p>Especialidad: {veterinarian.specialization}</p>
              <p>Disponible: {veterinarian.availability}</p>
              <Link to={`/veterinarians/${veterinarian.id}`}>Ver perfil</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
