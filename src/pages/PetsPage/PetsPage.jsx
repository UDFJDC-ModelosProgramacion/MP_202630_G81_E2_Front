import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PawIcon, SearchIcon } from '../../components/Icons/Icons'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import {
  ACTIVITY_LEVELS,
  REQUIRED_SPACES,
  SEXES,
  SIZES,
  SPECIES,
} from '../../constants/petOptions'
import { getPets } from '../../services/petService'
import styles from './PetsPage.module.css'

const EMPTY_FILTERS = {
  query: '',
  species: '',
  age: '',
  size: '',
  requiredSpace: '',
  compatibilityChildren: '',
  compatibilityOtherPets: '',
  activityLevel: '',
  sex: '',
}

const COMPATIBILITY_OPTIONS = [
  { value: '', label: 'Cualquiera' },
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

const matchesText = (value, filter) =>
  !filter ||
  String(value ?? '').trim().toLocaleLowerCase('es') === filter.trim().toLocaleLowerCase('es')

function matches(pet, filters) {
  const query = filters.query.trim().toLocaleLowerCase('es')
  const searchableText = [pet.name, pet.breed, pet.species]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('es')
  return (
    (!query || searchableText.includes(query)) &&
    matchesText(pet.species, filters.species) &&
    (!filters.age || String(pet.age ?? '') === filters.age) &&
    matchesText(pet.size, filters.size) &&
    matchesText(pet.requiredSpace, filters.requiredSpace) &&
    (!filters.compatibilityChildren ||
      String(pet.compatibilityChildren) === filters.compatibilityChildren) &&
    (!filters.compatibilityOtherPets ||
      String(pet.compatibilityOtherPets) === filters.compatibilityOtherPets) &&
    matchesText(pet.activityLevel, filters.activityLevel) &&
    matchesText(pet.sex, filters.sex)
  )
}

function PetCard({ pet }) {
  const photo = pet.photos?.find((item) => item?.url)?.url
  const [photoFailed, setPhotoFailed] = useState(false)
  const age =
    pet.age == null || pet.age === ''
      ? ''
      : `${pet.age} ${Number(pet.age) === 1 ? 'año' : 'años'}`
  const compatibility = [
    typeof pet.compatibilityChildren === 'boolean'
      ? `Niños: ${pet.compatibilityChildren ? 'Sí' : 'No'}`
      : '',
    typeof pet.compatibilityOtherPets === 'boolean'
      ? `Otras mascotas: ${pet.compatibilityOtherPets ? 'Sí' : 'No'}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={styles.card}>
      <div className={styles.photo} aria-hidden="true">
        {photo && !photoFailed ? (
          <img src={photo} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
        ) : (
          <PawIcon className={styles.paw} />
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <h2 className={styles.petName}>{pet.name}</h2>
          <span className={styles.species}>{pet.species}</span>
        </div>
        <p className={styles.summary}>
          {[pet.breed, age, pet.size, pet.sex, pet.requiredSpace, pet.activityLevel]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {compatibility && <p className={styles.summary}>{compatibility}</p>}
        {pet.shelter?.name && (
          <p className={styles.shelter}>
            {pet.shelter.name}
            {pet.shelter.city && ` · ${pet.shelter.city}`}
          </p>
        )}
        {pet.description && <p className={styles.description}>{pet.description}</p>}
        <Link to={`/pets/${pet.id}`} className={styles.cardLink}>
          Conocer a {pet.name}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </li>
  )
}

export default function PetsPage() {
  const isAdmin = getSession().role === ROLES.SHELTER_ADMIN
  const [pets, setPets] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [result, setResult] = useState({ status: 'loading', message: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    getPets()
      .then((response) => {
        if (active) {
          setPets(response)
          setResult({ status: 'ready', message: '' })
        }
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', message: error.message })
      })
    return () => {
      active = false
    }
  }, [attempt])

  const filteredPets = useMemo(() => pets.filter((pet) => matches(pet, filters)), [pets, filters])
  const hasFilters = Object.values(filters).some((value) => value !== '')

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          <PawIcon className={styles.markIcon} />
        </span>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Encuentra a tu nuevo compañero</p>
          <h1 className={styles.title}>Mascotas que buscan un hogar</h1>
          <p className={styles.subtitle}>
            Conoce a los animales de nuestros refugios y encuentra quien encaje contigo.
          </p>
        </div>
        {isAdmin && (
          <Link to="/pets/new" className={styles.primaryAction}>
            Registrar mascota
          </Link>
        )}
      </header>

      <form
        className={styles.filters}
        aria-label="Filtros de mascotas"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.queryField}>
          <label htmlFor="pet-query">Buscar por nombre o raza</label>
          <div className={styles.search}>
            <SearchIcon className={styles.searchIcon} />
            <input
              id="pet-query"
              name="query"
              type="search"
              value={filters.query}
              onChange={handleChange}
              placeholder="Ej. Luna o criollo"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-species">Especie</label>
          <select id="pet-species" name="species" value={filters.species} onChange={handleChange}>
            <option value="">Todas</option>
            {SPECIES.map((species) => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-age">Edad exacta</label>
          <input
            id="pet-age"
            name="age"
            type="number"
            min="0"
            step="1"
            value={filters.age}
            onChange={handleChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-size">Tamaño</label>
          <select id="pet-size" name="size" value={filters.size} onChange={handleChange}>
            <option value="">Todos</option>
            {SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-required-space">Espacio requerido</label>
          <select
            id="pet-required-space"
            name="requiredSpace"
            value={filters.requiredSpace}
            onChange={handleChange}
          >
            <option value="">Cualquiera</option>
            {REQUIRED_SPACES.map((space) => (
              <option key={space} value={space}>{space}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-compatibility-children">Compatible con niños</label>
          <select
            id="pet-compatibility-children"
            name="compatibilityChildren"
            value={filters.compatibilityChildren}
            onChange={handleChange}
          >
            {COMPATIBILITY_OPTIONS.map(({ value, label }) => (
              <option key={value || 'any'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-compatibility-pets">Compatible con otras mascotas</label>
          <select
            id="pet-compatibility-pets"
            name="compatibilityOtherPets"
            value={filters.compatibilityOtherPets}
            onChange={handleChange}
          >
            {COMPATIBILITY_OPTIONS.map(({ value, label }) => (
              <option key={value || 'any'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-activity">Nivel de actividad</label>
          <select
            id="pet-activity"
            name="activityLevel"
            value={filters.activityLevel}
            onChange={handleChange}
          >
            <option value="">Cualquiera</option>
            {ACTIVITY_LEVELS.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pet-sex">Sexo</label>
          <select id="pet-sex" name="sex" value={filters.sex} onChange={handleChange}>
            <option value="">Todos</option>
            {SEXES.map((sex) => (
              <option key={sex} value={sex}>{sex}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button type="button" className={styles.clear} onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </form>

      {result.status === 'loading' && <ScreenState state="loading" message="Cargando mascotas..." />}
      {result.status === 'error' && (
        <>
          <ScreenState state="error" message={result.message} />
          <button type="button" className={styles.retry} onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </button>
        </>
      )}
      {result.status === 'ready' && (
        <>
          <p className={styles.count} role="status">
            {filteredPets.length}{' '}
            {filteredPets.length === 1 ? 'mascota encontrada' : 'mascotas encontradas'}
          </p>
          {filteredPets.length === 0 ? (
            <div className={styles.empty} role="status">
              <PawIcon className={styles.emptyIcon} />
              <h2>{hasFilters ? 'No encontramos coincidencias' : 'Aún no hay mascotas registradas'}</h2>
              <p>
                {hasFilters
                  ? 'Prueba con otros filtros o limpia la búsqueda para ver todas las mascotas.'
                  : 'Vuelve pronto para conocer a los nuevos integrantes de nuestros refugios.'}
              </p>
              {hasFilters && (
                <button type="button" className={styles.clear} onClick={clearFilters}>
                  Ver todas las mascotas
                </button>
              )}
            </div>
          ) : (
            <ul className={styles.list} aria-label="Mascotas disponibles">
              {filteredPets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
