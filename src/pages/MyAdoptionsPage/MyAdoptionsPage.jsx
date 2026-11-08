import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getAdoptions } from '../../services/adoptionService'
import { adoptionStatusLabel } from '../../utils/adoptions'
import { formatDay, sortByDateDescending } from '../../utils/dates'
import styles from './MyAdoptionsPage.module.css'

const dayOf = (value) => String(value ?? '').slice(0, 10)

function AdoptionsList({ adopterId }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', adoptions: [], message: '' })

  useEffect(() => {
    let mounted = true
    getAdoptions({ adopterId })
      .then((adoptions) => {
        if (mounted) {
          setResult({ status: 'ready', adoptions: sortByDateDescending(adoptions), message: '' })
        }
      })
      .catch((error) => {
        if (mounted) setResult({ status: 'error', adoptions: [], message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [adopterId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, adoptions, message } = result

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Mis adopciones</h1>
      <p className={styles.subtitle}>
        Consulta las adopciones en las que participas, con su estado y las notas del refugio.
      </p>

      {status === 'loading' && <ScreenState state="loading" />}

      {status === 'error' && (
        <>
          <ScreenState state="error" message={message} />
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      {status === 'ready' && adoptions.length === 0 && (
        <ScreenState state="empty" message="Aún no tienes adopciones registradas." />
      )}

      {status === 'ready' && adoptions.length > 0 && (
        <ul className={styles.list} aria-label="Mis adopciones">
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
              <p>Refugio: {adoption.shelter?.name}</p>
              <p className={styles.date}>
                Fecha de la adopción:{' '}
                <time dateTime={dayOf(adoption.date)}>{formatDay(adoption.date)}</time>
              </p>
              <p className={styles.notes}>Notas importantes: {adoption.importantNotes}</p>
              <Link
                to={`/adoptions/${adoption.id}`}
                className={styles.detailLink}
                aria-label={`Ver detalle de la adopción de ${adoption.pet?.name}`}
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

export default function MyAdoptionsPage() {
  const session = getSession()

  if (session.role !== ROLES.ADOPTER) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>Mis adopciones</h1>
        <ScreenState state="error" message="Solo los adoptantes pueden consultar sus adopciones." />
      </section>
    )
  }

  return <AdoptionsList adopterId={session.userId} />
}
