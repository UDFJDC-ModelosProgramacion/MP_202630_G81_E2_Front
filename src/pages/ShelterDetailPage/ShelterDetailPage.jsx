import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HeartIcon } from '../../components/Icons/Icons'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import { getShelter } from '../../services/shelterService'
import { canManageShelter, toShelterDetail } from './shelterDetail'
import styles from './ShelterDetailPage.module.css'

const ERROR_TITLES = {
  404: 'Shelter not found',
  412: 'Shelter id is not valid',
}
const GENERIC_ERROR_TITLE = 'No se pudo cargar el refugio'

function ShelterError({ error }) {
  const title = ERROR_TITLES[error.status] ?? GENERIC_ERROR_TITLE
  // The message of the back-end goes under the title unless it adds nothing to it.
  const showMessage = error.message && error.message !== title && error.message !== `Error ${error.status}`
  return (
    <section className={styles.errorBox} role="alert">
      <h1 className={styles.errorTitle}>{title}</h1>
      {showMessage && <p className={styles.errorMessage}>{error.message}</p>}
      <Link to="/shelters" className={styles.back}>
        Volver a la lista de refugios
      </Link>
    </section>
  )
}

function Panel({ title, badge, action, children }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{title}</h2>
        {badge && <span className={styles.badge}>{badge}</span>}
        {action}
      </header>
      {children}
    </section>
  )
}

function PetsPanel({ pets, canManage }) {
  const total = `${pets.length} ${pets.length === 1 ? 'mascota' : 'mascotas'} en total`
  return (
    <Panel
      title="Mascotas"
      badge={total}
      action={
        canManage && (
          <Link to="/pets/new" className={styles.cta}>
            + Registrar mascota
          </Link>
        )
      }
    >
      {pets.length === 0 ? (
        <p className={styles.empty} role="status">
          Este refugio aún no tiene mascotas registradas.
        </p>
      ) : (
        <ul className={styles.list} aria-label="Mascotas del refugio">
          {pets.map((pet) => (
            <li key={pet.id} className={styles.row}>
              <span className={`${styles.avatar} ${styles.round}`} aria-hidden="true">
                {pet.initials}
              </span>
              <div className={styles.info}>
                <h3 className={styles.rowTitle}>{pet.name}</h3>
                <p className={styles.rowText}>{pet.summary}</p>
              </div>
              <Link
                to={`/pets/${pet.id}`}
                className={styles.rowLink}
                aria-label={`Ver perfil de ${pet.name}`}
              >
                Ver perfil
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function EventsPanel({ events, canManage, shelterId }) {
  return (
    <Panel
      title="Eventos"
      action={
        canManage && (
          <Link to={`/shelters/${shelterId}/events/new`} className={styles.cta}>
            + Crear evento
          </Link>
        )
      }
    >
      {events.length === 0 ? (
        <p className={styles.empty} role="status">
          Este refugio aún no tiene eventos programados.
        </p>
      ) : (
        <ul className={styles.list} aria-label="Eventos del refugio">
          {events.map((event) => (
            <li key={event.id} className={styles.row}>
              <span className={`${styles.avatar} ${styles.square}`} aria-hidden="true">
                <span className={styles.month}>{event.month}</span>
                <span className={styles.day}>{event.day}</span>
              </span>
              <div className={styles.info}>
                <h3 className={styles.rowTitle}>{event.name}</h3>
                <p className={styles.rowText}>{event.summary}</p>
              </div>
              {event.type && <span className={styles.chip}>{event.type}</span>}
              <Link
                to={`/events/${event.id}`}
                className={styles.rowLink}
                aria-label={`Ver detalle de ${event.name}`}
              >
                Ver detalle
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function ShelterDetail({ shelterId }) {
  const [result, setResult] = useState({ status: 'loading', shelter: null, error: null })

  useEffect(() => {
    let cancelled = false
    getShelter(shelterId)
      .then((response) => {
        if (!cancelled) {
          setResult({ status: 'ready', shelter: toShelterDetail(response), error: null })
        }
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', shelter: null, error })
      })
    return () => {
      cancelled = true
    }
  }, [shelterId])

  const { status, shelter, error } = result
  if (status === 'loading') return <ScreenState state="loading" message="Cargando refugio..." />
  if (status === 'error') return <ShelterError error={error} />

  const canManage = canManageShelter(getSession(), shelter, ROLES.SHELTER_ADMIN)

  return (
    <section className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumb}>
        <Link to="/shelters">Refugios</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{shelter.name}</span>
      </nav>

      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          <HeartIcon className={styles.markIcon} />
        </span>
        <div className={styles.heading}>
          <h1 className={styles.title}>{shelter.name}</h1>
          <dl className={styles.meta}>
            <div>
              <dt>NIT</dt>
              <dd>{shelter.nit}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{shelter.location}</dd>
            </div>
            <div>
              <dt>Ciudad</dt>
              <dd>{shelter.city}</dd>
            </div>
          </dl>
        </div>
        {canManage && (
          <div className={styles.actions}>
            <Link to={`/shelters/${shelter.id}/edit`} className={styles.edit}>
              Editar
            </Link>
            {/* Deleting (with its confirmation, CT3) belongs to HU05. */}
            <button
              type="button"
              className={styles.delete}
              disabled
              title="La eliminación de refugios estará disponible próximamente"
            >
              Eliminar
            </button>
          </div>
        )}
      </header>

      <div className={styles.columns}>
        <PetsPanel pets={shelter.pets} canManage={canManage} />
        <EventsPanel events={shelter.events} canManage={canManage} shelterId={shelter.id} />
      </div>
    </section>
  )
}

export default function ShelterDetailPage() {
  const { shelterId } = useParams()
  // The key restarts the loading state when the id in the address changes.
  return <ShelterDetail key={shelterId} shelterId={shelterId} />
}
