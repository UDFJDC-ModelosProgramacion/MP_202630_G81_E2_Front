import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ModalDialog from '../../components/ModalDialog/ModalDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import useAuth from '../../auth/useAuth'
import {
  createAdoptionRequest,
  deleteAdoptionRequest,
  getAllAdoptionRequests,
  updateAdoptionRequest,
} from '../../services/adoptionRequestService'
import { getPets } from '../../services/petService'
import {
  filterAdoptionRequests,
  validateAdoptionRequest,
} from './adoptionRequestLogic'
import styles from './AdoptionRequestsPage.module.css'

export default function AdoptionRequestsPage() {
  const { session } = useAuth()
  const currentUserId = session?.userId || 1
  const currentUserRole = session?.role || 'ADOPTER'
  const isAdmin = currentUserRole === 'SHELTER_ADMIN'

  const [requests, setRequests] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchPet, setSearchPet] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newPetId, setNewPetId] = useState('')
  const [newJustification, setNewJustification] = useState('')
  const [formError, setFormError] = useState('')

  const [requestToCancel, setRequestToCancel] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      getAllAdoptionRequests({
        adopterId: isAdmin ? null : currentUserId,
        currentUserId,
        currentUserRole,
      }),
      getPets(),
    ])
      .then(([reqs, petList]) => {
        if (!active) return
        setRequests(reqs || [])
        setPets(petList || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Error al cargar solicitudes de adopción')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentUserId, currentUserRole, isAdmin])

  const filtered = filterAdoptionRequests(requests, {
    petName: searchPet,
    status: statusFilter,
  })

  // Submit a new adoption request (HU81)
  async function handleCreateRequest(e) {
    e.preventDefault()
    const errors = validateAdoptionRequest(newJustification, newPetId)
    if (Object.keys(errors).length > 0) {
      setFormError(errors.justification || errors.petId)
      return
    }

    try {
      const payload = {
        adopter: { id: currentUserId },
        pet: { id: Number(newPetId) },
        justification: newJustification.trim(),
        status: 'PENDING',
      }
      const created = await createAdoptionRequest(payload)
      setRequests((prev) => [...prev, created])
      setIsNewModalOpen(false)
      setNewPetId('')
      setNewJustification('')
      setFormError('')
      setSuccessMessage('Solicitud de adopción enviada con éxito.')
    } catch (err) {
      setFormError(err?.message || 'Error al enviar la solicitud.')
    }
  }

  // Admin approves or rejects request (HU83)
  async function handleUpdateStatus(reqId, newStatus) {
    try {
      const updated = await updateAdoptionRequest(reqId, { status: newStatus })
      setRequests((prev) => prev.map((r) => (r.id === reqId ? updated : r)))
      setSuccessMessage(`Solicitud marcada como ${newStatus}.`)
    } catch (err) {
      setActionError(err?.message || 'No se pudo actualizar el estado de la solicitud.')
    }
  }

  // Adopter cancels pending request (HU84)
  async function handleConfirmCancel() {
    if (!requestToCancel) return
    try {
      await deleteAdoptionRequest(requestToCancel.id)
      setRequests((prev) => prev.filter((r) => r.id !== requestToCancel.id))
      setRequestToCancel(null)
      setSuccessMessage('Solicitud cancelada correctamente.')
    } catch (err) {
      setActionError(err?.message || 'No se pudo cancelar la solicitud.')
      setRequestToCancel(null)
    }
  }

  if (loading) return <ScreenState state="loading" />
  if (error) return <ScreenState state="error" message={error} />

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.mark} aria-hidden="true">
            📋
          </span>
          <div>
            <h1 className={styles.title}>
              {isAdmin ? 'Solicitudes de Adopción Recibidas' : 'Mis Solicitudes de Adopción'}
            </h1>
            <p className={styles.subtitle}>
              Gestiona y revisa el progreso de las solicitudes de adopción en la plataforma.
            </p>
          </div>
        </div>
        {!isAdmin && (
          <button
            type="button"
            className={styles.approveBtn}
            onClick={() => setIsNewModalOpen(true)}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            Nueva Solicitud
          </button>
        )}
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="search"
            placeholder="Buscar por nombre de mascota..."
            value={searchPet}
            onChange={(e) => setSearchPet(e.target.value)}
            aria-label="Buscar por mascota"
          />
        </div>
        <div className={styles.statusFilter}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobada</option>
            <option value="REJECTED">Rechazada</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No se encontraron solicitudes de adopción.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Adoptante</th>
                <th>Justificación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isPending = (r.status || '').toUpperCase() === 'PENDING'
                return (
                  <tr key={r.id}>
                    <td>{r.pet?.name || 'Mascota'}</td>
                    <td>{r.adopter?.firstName ? `${r.adopter.firstName} ${r.adopter.lastName || ''}` : 'Adoptante'}</td>
                    <td>{r.justification}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          r.status === 'APPROVED'
                            ? styles.statusApproved
                            : r.status === 'REJECTED'
                            ? styles.statusRejected
                            : styles.statusPending
                        }`}
                      >
                        {r.status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {isAdmin && isPending && (
                          <>
                            <button
                              type="button"
                              className={styles.approveBtn}
                              onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className={styles.rejectBtn}
                              onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {!isAdmin && isPending && (
                          <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => setRequestToCancel(r)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isNewModalOpen && (
        <ModalDialog onClose={() => setIsNewModalOpen(false)}>
          <h2 style={{ margin: '0 0 1rem' }}>Enviar Solicitud de Adopción</h2>
          <form onSubmit={handleCreateRequest} className={styles.modalForm}>
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            <div>
              <label htmlFor="petSelect">Mascota a adoptar:</label>
              <select
                id="petSelect"
                value={newPetId}
                onChange={(e) => setNewPetId(e.target.value)}
                required
              >
                <option value="">Selecciona una mascota...</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modalJustification">Motivo / Justificación:</label>
              <textarea
                id="modalJustification"
                placeholder="Explica las condiciones de tu hogar y tu motivación para adoptar..."
                value={newJustification}
                onChange={(e) => setNewJustification(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsNewModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.approveBtn}>
                Enviar Solicitud
              </button>
            </div>
          </form>
        </ModalDialog>
      )}

      {requestToCancel && (
        <ConfirmDialog
          title="¿Cancelar solicitud de adopción?"
          message="¿Estás seguro de que deseas cancelar tu solicitud de adopción para esta mascota?"
          confirmLabel="Cancelar Solicitud"
          onConfirm={handleConfirmCancel}
          onCancel={() => setRequestToCancel(null)}
        />
      )}

      {successMessage && (
        <SuccessDialog
          title="Operación exitosa"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {actionError && (
        <ErrorDialog
          title="Error en la solicitud"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}
    </section>
  )
}
