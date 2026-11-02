import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/adopterSession'
import { HOUSING_TYPES } from '../../constants/adopterOptions'
import { getAdopters } from '../../services/adopterService'
import styles from './AdoptersPage.module.css'

const NO_FILTERS = { nationalId: '', housingType: '', occupation: '' }

const hasFilters = (filters) =>
  Boolean(filters.nationalId.trim() || filters.housingType.trim() || filters.occupation.trim())

const fullName = ({ firstName = '', lastName = '' }) => `${firstName} ${lastName}`.trim()

const byName = (a, b) => fullName(a).localeCompare(fullName(b), 'es', { sensitivity: 'base' })

const distinct = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))

export default function AdoptersPage() {
  const isAdmin = getSession().role === ROLES.SHELTER_ADMIN
  const [filters, setFilters] = useState(NO_FILTERS)
  const [housingOptions, setHousingOptions] = useState(HOUSING_TYPES)
  const [result, setResult] = useState({
    status: 'loading',
    adopters: [],
    filtered: false,
    message: '',
  })
  const lastRequest = useRef(0)

  const search = useCallback((appliedFilters) => {
    const requestId = ++lastRequest.current
    return getAdopters(appliedFilters)
      .then((data) => {
        if (requestId !== lastRequest.current) return null
        const adopters = [...data].sort(byName)
        setResult({ status: 'ready', adopters, filtered: hasFilters(appliedFilters), message: '' })
        return adopters
      })
      .catch((error) => {
        if (requestId === lastRequest.current) {
          setResult({
            status: 'error',
            adopters: [],
            filtered: hasFilters(appliedFilters),
            message: error.message,
          })
        }
        return null
      })
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    search(NO_FILTERS).then((adopters) => {
      if (adopters) {
        setHousingOptions(distinct([...HOUSING_TYPES, ...adopters.map((a) => a.housingType)]))
      }
    })
  }, [isAdmin, search])

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setResult((current) => ({ ...current, status: 'loading' }))
    search(filters)
  }

  function handleClear() {
    setFilters(NO_FILTERS)
    setResult((current) => ({ ...current, status: 'loading' }))
    search(NO_FILTERS)
  }

  const { status, adopters, filtered, message } = result

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Adoptantes</h1>

      {!isAdmin ? (
        <ScreenState
          state="error"
          message="Solo el administrador del refugio puede consultar los adoptantes."
        />
      ) : (
        <>
          <form className={styles.filters} onSubmit={handleSubmit} aria-label="Filtros de adoptantes">
            <div className={styles.field}>
              <label htmlFor="nationalId">Cédula</label>
              <input
                id="nationalId"
                name="nationalId"
                value={filters.nationalId}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="housingType">Tipo de vivienda</label>
              <select
                id="housingType"
                name="housingType"
                value={filters.housingType}
                onChange={handleChange}
              >
                <option value="">Todas</option>
                {housingOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="occupation">Ocupación</label>
              <input
                id="occupation"
                name="occupation"
                value={filters.occupation}
                onChange={handleChange}
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.search}>
                Buscar
              </button>
            </div>
          </form>

          {status === 'loading' && <ScreenState state="loading" />}
          {status === 'error' && <ScreenState state="error" message={message} />}
          {status === 'ready' && adopters.length === 0 && (
            <>
              <ScreenState
                state="empty"
                message={
                  filtered
                    ? 'No se encontraron adoptantes con los filtros indicados.'
                    : 'Aún no hay adoptantes registrados.'
                }
              />
              {filtered && (
                <button type="button" className={styles.clear} onClick={handleClear}>
                  Limpiar filtros
                </button>
              )}
            </>
          )}
          {status === 'ready' && adopters.length > 0 && (
            <ul className={styles.list} aria-label="Lista de adoptantes">
              {adopters.map((adopter) => (
                <li key={adopter.id} className={styles.card}>
                  <h2>{fullName(adopter)}</h2>
                  <p className={styles.meta}>Cédula: {adopter.nationalId}</p>
                  <p className={styles.meta}>Vivienda: {adopter.housingType}</p>
                  <p className={styles.meta}>Ocupación: {adopter.occupation}</p>
                  <Link to={`/adopters/${adopter.id}`}>Ver detalle</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
