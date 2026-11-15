import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PawIcon } from '../../components/Icons/Icons'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getPet } from '../../services/petService'
import { formatDay } from '../../utils/dates'
import styles from './PetDetailPage.module.css'

const COMPATIBILITY_FIELDS = [
  ['compatibilityChildren', 'Compatible con niños'],
  ['compatibilityOtherPets', 'Compatible con otras mascotas'],
]

function DetailRow({ label, children }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function PetProfile({ pet }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const photo = pet.photos?.find((item) => item?.url)?.url
  const shelter = pet.shelter

  return (
    <section className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumb}>
        <Link to="/pets">Mascotas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{pet.name}</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.photo}>
          {photo && !photoFailed ? (
            <img src={photo} alt={`Fotografía de ${pet.name}`} onError={() => setPhotoFailed(true)} />
          ) : (
            <PawIcon className={styles.paw} />
          )}
        </div>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Conoce a</p>
          <h1 className={styles.title}>{pet.name}</h1>
          <p className={styles.subtitle}>
            {[pet.species, pet.breed, pet.age != null ? `${pet.age} ${Number(pet.age) === 1 ? 'año' : 'años'}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {shelter?.id && (
            <p className={styles.shelter}>
              En {shelter.name ? (
                <Link to={`/shelters/${shelter.id}`}>{shelter.name}</Link>
              ) : (
                'un refugio'
              )}
            </p>
          )}
          <Link to={`/pets/${pet.id}/medical-events`} className={styles.primaryAction}>
            Ver historia médica
          </Link>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="about-title">
          <h2 id="about-title" className={styles.panelTitle}>Sobre {pet.name}</h2>
          {pet.description ? (
            <p className={styles.description}>{pet.description}</p>
          ) : (
            <p className={styles.muted}>Aún no hay una descripción para esta mascota.</p>
          )}
          <dl className={styles.details}>
            <DetailRow label="Especie">{pet.species}</DetailRow>
            <DetailRow label="Raza">{pet.breed}</DetailRow>
            <DetailRow label="Edad">{pet.age != null ? `${pet.age} ${Number(pet.age) === 1 ? 'año' : 'años'}` : null}</DetailRow>
            <DetailRow label="Sexo">{pet.sex}</DetailRow>
            <DetailRow label="Tamaño">{pet.size}</DetailRow>
            <DetailRow label="Estado de salud">{pet.healthStatus}</DetailRow>
            <DetailRow label="Fecha de ingreso">{pet.admissionDate ? formatDay(pet.admissionDate) : null}</DetailRow>
            <DetailRow label="Nivel de actividad">{pet.activityLevel}</DetailRow>
            <DetailRow label="Espacio requerido">{pet.requiredSpace}</DetailRow>
            <DetailRow label="Temperamento">{pet.temperament}</DetailRow>
            <DetailRow label="Necesidades específicas">{pet.specificNeeds}</DetailRow>
            {COMPATIBILITY_FIELDS.map(([key, label]) => (
              <DetailRow key={key} label={label}>
                {typeof pet[key] === 'boolean' ? (pet[key] ? 'Sí' : 'No') : null}
              </DetailRow>
            ))}
          </dl>
        </section>

        <aside className={styles.callout}>
          <span className={styles.calloutIcon} aria-hidden="true"><PawIcon /></span>
          <h2>¿Te gustaría darle un hogar?</h2>
          <p>Comunícate con el refugio para conocer el proceso de adopción y descubrir si son el equipo perfecto.</p>
          {shelter?.id && (
            <Link to={`/shelters/${shelter.id}`} className={styles.secondaryAction}>
              Conocer el refugio
            </Link>
          )}
          <Link to="/pets" className={styles.backLink}>Volver a todas las mascotas</Link>
        </aside>
      </div>
    </section>
  )
}

export default function PetDetailPage() {
  const { petId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', pet: null, message: '' })

  useEffect(() => {
    let active = true
    getPet(petId)
      .then((pet) => {
        if (active) setResult({ status: 'ready', pet, message: '' })
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', pet: null, message: error.message })
      })
    return () => {
      active = false
    }
  }, [petId, attempt])

  if (result.status === 'loading') return <ScreenState state="loading" message="Cargando perfil de la mascota..." />
  if (result.status === 'error') {
    return (
      <section className={styles.errorPage}>
        <ScreenState state="error" message={result.message} />
        <div className={styles.errorActions}>
          <button type="button" className={styles.secondaryAction} onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </button>
          <Link to="/pets" className={styles.backLink}>Volver a mascotas</Link>
        </div>
      </section>
    )
  }
  return <PetProfile pet={result.pet} />
}
