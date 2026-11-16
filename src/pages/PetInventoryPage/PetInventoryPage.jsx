import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import { deletePet } from '../../services/petService'
import { getShelter } from '../../services/shelterService'
import { toShelterInventory } from '../ShelterDetailPage/shelterDetail'
import styles from './PetInventoryPage.module.css'

export default function PetInventoryPage() {
  const session = getSession()
  const isAdmin = session.role === ROLES.SHELTER_ADMIN
  const shelterId = session.shelterId
  const [result, setResult] = useState({ status: 'loading', shelter: null, message: '' })
  const [attempt, setAttempt] = useState(0)
  const [petToDelete, setPetToDelete] = useState(null)
  const [deletingPetId, setDeletingPetId] = useState(null)
  const [errorDialog, setErrorDialog] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isAdmin || shelterId == null) return undefined

    let active = true
    getShelter(shelterId)
      .then((response) => {
        if (active) {
          setResult({ status: 'ready', shelter: toShelterInventory(response), message: '' })
        }
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', shelter: null, message: error.message })
      })
    return () => {
      active = false
    }
  }, [attempt, isAdmin, shelterId])

  async function confirmDelete() {
    if (!petToDelete) return

    setDeletingPetId(petToDelete.id)
    try {
      await deletePet(petToDelete.id)
      setResult((current) => ({
        ...current,
        shelter: {
          ...current.shelter,
          pets: current.shelter.pets.filter((pet) => pet.id !== petToDelete.id),
        },
      }))
      setNotice(`${petToDelete.name} se eliminó correctamente.`)
      setPetToDelete(null)
    } catch (error) {
      setErrorDialog({
        petName: petToDelete.name,
        message: error.message,
        status: error.status,
      })
      setPetToDelete(null)
    } finally {
      setDeletingPetId(null)
    }
  }

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message="Solo el administrador del refugio puede consultar el inventario de mascotas."
        />
        <Link to="/pets" className={styles.backLink}>Volver al catálogo</Link>
      </section>
    )
  }

  if (shelterId == null) {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message="No hay un refugio asociado a esta sesión de administrador."
        />
        <Link to="/pets" className={styles.backLink}>Volver al catálogo</Link>
      </section>
    )
  }

  if (result.status === 'loading') {
    return <ScreenState state="loading" message="Cargando inventario de mascotas..." />
  }

  if (result.status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message={result.message || 'No se pudo cargar el inventario de mascotas.'}
          onRetry={() => setAttempt((value) => value + 1)}
        />
        <Link to="/pets" className={styles.backLink}>Volver al catálogo</Link>
      </section>
    )
  }

  const { shelter } = result
  const count = `${shelter.pets.length} ${
    shelter.pets.length === 1 ? 'mascota registrada' : 'mascotas registradas'
  }`

  return (
    <section className={styles.page}>
      <nav aria-label="Ruta de navegación" className={styles.breadcrumb}>
        <Link to="/pets">Mascotas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Inventario</span>
      </nav>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administración del refugio</p>
          <h1 className={styles.title}>Inventario de mascotas</h1>
          <p className={styles.subtitle}>
            {shelter.name}
            {shelter.city && ` · ${shelter.city}`}
          </p>
        </div>
        {shelter.pets.length > 0 && (
          <Link to="/pets/new" className={styles.primaryAction}>Registrar mascota</Link>
        )}
      </header>

      <p className={styles.count} role="status">{count}</p>
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {shelter.pets.length === 0 ? (
        <div className={styles.empty} role="status">
          <h2>Tu refugio aún no tiene mascotas registradas</h2>
          <p>Registra la primera mascota para comenzar a organizar el inventario.</p>
          <Link to="/pets/new" className={styles.primaryAction}>Registrar mascota</Link>
        </div>
      ) : (
        <ul className={styles.list} aria-label="Mascotas del inventario">
          {shelter.pets.map((pet) => (
            <li key={pet.id} className={styles.row}>
              <span className={styles.avatar} aria-hidden="true">{pet.initials}</span>
              <div className={styles.info}>
                <h2 className={styles.petName}>{pet.name}</h2>
                <p className={styles.summary}>{pet.summary || 'Datos generales no registrados'}</p>
              </div>
              <div className={styles.rowActions}>
                <Link to={`/pets/${pet.id}`} className={styles.petLink}>
                  Ver perfil de {pet.name}
                </Link>
                <button
                  type="button"
                  className={styles.deleteAction}
                  aria-label={`Eliminar a ${pet.name}`}
                  disabled={deletingPetId === pet.id}
                  onClick={() => {
                    setNotice('')
                    setPetToDelete(pet)
                  }}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {petToDelete && (
        <ConfirmDialog
          title={`¿Eliminar a ${petToDelete.name}?`}
          message="Esta acción es permanente. Si tiene una adopción, convivencia activa o historial que impida eliminarla, el servidor rechazará la solicitud."
          confirmLabel="Eliminar mascota"
          pendingLabel="Eliminando..."
          pending={deletingPetId === petToDelete.id}
          onConfirm={confirmDelete}
          onCancel={() => setPetToDelete(null)}
        />
      )}

      {errorDialog && (
        <ErrorDialog
          title={`No se pudo eliminar a ${errorDialog.petName}`}
          message={errorDialog.message || 'El servidor no pudo eliminar la mascota.'}
          status={errorDialog.status}
          hint={
            errorDialog.status === 412
              ? 'La mascota tiene una relación o historial que impide eliminarla.'
              : undefined
          }
          actionLabel="Entendido"
          onClose={() => {
            setErrorDialog(null)
            if (errorDialog.status === 404) setAttempt((value) => value + 1)
          }}
        />
      )}
    </section>
  )
}
