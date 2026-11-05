import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon, PawIcon, SearchIcon } from '../../components/Icons/Icons'
import ScreenState from '../../components/ScreenState/ScreenState'
import { CITIES } from '../../constants/shelterOptions'
import { getShelters } from '../../services/shelterService'
import styles from './ShelterListPage.module.css'

const NO_FILTERS = { city: '', location: '' }

const hasFilters = (filters) => Boolean(filters.city.trim() || filters.location.trim())

// Registered cities may include some that are not in the registration list.
const cityOptions = (shelters) =>
  [...new Set([...CITIES, ...shelters.map((shelter) => shelter.city).filter(Boolean)])].sort(
    (a, b) => a.localeCompare(b),
  )

function EmptyResult({ filtered, onClear }) {
  return (
    <div className={styles.empty} role="status">
      <h2 className={styles.emptyTitle}>
        {filtered ? 'No se encontraron refugios con esos filtros' : 'Aún no hay refugios registrados'}
      </h2>
      {filtered && (
        <button type="button" className={styles.clear} onClick={onClear}>
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

function ShelterCard({ shelter }) {
  return (
    <li className={styles.card}>
      <span className={styles.avatar} aria-hidden="true">
        <PawIcon className={styles.avatarIcon} />
      </span>
      <div className={styles.info}>
        <h2 className={styles.name}>
          <Link to={`/shelters/${shelter.id}`} className={styles.link}>
            {shelter.name}
          </Link>
        </h2>
        <dl className={styles.data}>
          <div>
            <dt>NIT</dt>
            <dd>{shelter.nit}</dd>
          </div>
          <div>
            <dt>Ciudad</dt>
            <dd>{shelter.city}</dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>{shelter.location}</dd>
          </div>
        </dl>
      </div>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </li>
  )
}

export default function ShelterListPage() {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [cities, setCities] = useState(CITIES)
  const [result, setResult] = useState({
    status: 'loading',
    shelters: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  // Only the answer of the latest request is shown, so a slow old one cannot overwrite it.
  const search = useCallback((appliedFilters) => {
    const requestId = ++lastRequest.current
    return getShelters(appliedFilters)
      .then((shelters) => {
        if (requestId === lastRequest.current) {
          setResult({
            status: 'ready',
            shelters,
            filtered: hasFilters(appliedFilters),
            message: '',
          })
        }
        return shelters
      })
      .catch((error) => {
        if (requestId === lastRequest.current) {
          setResult({
            status: 'error',
            shelters: [],
            filtered: hasFilters(appliedFilters),
            message: error.message,
          })
        }
        return null
      })
  }, [])

  useEffect(() => {
    search(NO_FILTERS).then((shelters) => {
      if (shelters) setCities(cityOptions(shelters))
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

  function clearFilters() {
    setFilters(NO_FILTERS)
    setResult((current) => ({ ...current, status: 'loading' }))
    search(NO_FILTERS)
  }

  const { status, shelters, filtered, message } = result

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          <HeartIcon className={styles.markIcon} />
        </span>
        <h1 className={styles.title}>Busca un Refugio cerca de Ti</h1>
      </header>

      <form className={styles.filters} onSubmit={handleSubmit} aria-label="Filtros de refugios">
        <div className={styles.row}>
          <div className={`${styles.field} ${styles.location}`}>
            <label htmlFor="location">Dirección</label>
            <div className={styles.search}>
              <SearchIcon className={styles.searchIcon} />
              <input
                id="location"
                name="location"
                type="text"
                value={filters.location}
                onChange={handleChange}
                placeholder="Ej. Carrera 15 # 85 - 32"
                aria-describedby="filters-help"
              />
            </div>
          </div>

          <div className={`${styles.field} ${styles.city}`}>
            <label htmlFor="city">Ciudad</label>
            <select id="city" name="city" value={filters.city} onChange={handleChange}>
              <option value="">Todas</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.submit}>
            Buscar
          </button>
        </div>

        <div className={styles.footer}>
          <p id="filters-help" className={styles.help}>
            La búsqueda compara el texto exacto, sin distinguir mayúsculas de minúsculas. No
            encuentra coincidencias parciales: la dirección debe escribirse completa, tal como está
            registrada. Si usa ambos filtros, el refugio debe cumplir los dos.
          </p>
          <button type="button" className={styles.clear} onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {status === 'loading' && <ScreenState state="loading" />}
      {status === 'error' && <ScreenState state="error" message={message} />}
      {status === 'ready' && shelters.length === 0 && (
        <EmptyResult filtered={filtered} onClear={clearFilters} />
      )}
      {status === 'ready' && shelters.length > 0 && (
        <ul className={styles.list} aria-label="Lista de refugios">
          {shelters.map((shelter) => (
            <ShelterCard key={shelter.id} shelter={shelter} />
          ))}
        </ul>
      )}
    </section>
  )
}