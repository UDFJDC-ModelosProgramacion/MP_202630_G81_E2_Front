import { useEffect, useState } from 'react'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import ModalDialog from '../../components/ModalDialog/ModalDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import useAuth from '../../auth/useAuth'
import { getPets } from '../../services/petService'
import {
  createReturn,
  getAllReturns,
  updateReturn,
} from '../../services/returnService'
import { filterReturns, validateReturnReason } from './returnLogic'
import styles from './ReturnsPage.module.css'

export default function ReturnsPage() {
  const { session } = useAuth()
  const currentUserId = session?.userId || 1
  const isAdmin = session?.role === 'SHELTER_ADMIN'

  const [returns, setReturns] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchPet, setSearchPet] = useState('')
  const [searchAdopter, setSearchAdopter] = useState('')

  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [newPetId, setNewPetId] = useState('')
  const [newReason, setNewReason] = useState('')
  const [registerError, setRegisterError] = useState('')

  const [selectedReturn, setSelectedReturn] = useState(null)
  const [editReasonText, setEditReasonText] = useState('')
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getAllReturns(), getPets()])
      .then(([returnList, petList]) => {
        if (!active) return
        setReturns(returnList || [])
        setPets(petList || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Error al cargar devoluciones')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = filterReturns(returns, {
    petName: searchPet,
    adopterName: searchAdopter,
  })

  // Register a pet return (HU85)
  async function handleCreateReturn(e) {
    e.preventDefault()
    const errors = validateReturnReason(newReason, newPetId)
    if (Object.keys(errors).length > 0) {
      setRegisterError(errors.reason || errors.petId)
      return
    }

    try {
      const payload = {
        pet: { id: Number(newPetId) },
        adopter: { id: currentUserId },
        reason: newReason.trim(),
        returnDate: new Date().toISOString(),
      }
      const created = await createReturn(payload)
      setReturns((prev) => [...prev, created])
      setIsRegisterOpen(false)
      setNewPetId('')
      setNewReason('')
      setRegisterError('')
      setSuccessMessage('Devolución registrada exitosamente.')
    } catch (err) {
      setRegisterError(err?.message || 'No se pudo registrar la devolución.')
    }
  }

  // Update return reason (HU88)
  async function handleUpdateReturn(e) {
    e.preventDefault()
    if (!editReasonText.trim() || !selectedReturn) return

    try {
      const updated = await updateReturn(selectedReturn.id, {
        ...selectedReturn,
        reason: editReasonText.trim(),
      })
      setReturns((prev) =>
        prev.map((item) => (item.id === selectedReturn.id ? updated : item)),
      )
      setSelectedReturn(null)
      setEditReasonText('')
      setSuccessMessage('Motivo de devolución actualizado correctamente.')
    } catch (err) {
      setActionError(err?.message || 'Error al actualizar el motivo de devolución.')
    }
  }

  if (loading) return <ScreenState state="loading" />
  if (error) return <ScreenState state="error" message={error} />

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.mark} aria-hidden="true">
            🔄
          </span>
          <div>
            <h1 className={styles.title}>Devoluciones de Mascotas</h1>
            <p className={styles.subtitle}>
              Registro, seguimiento y actualización del reingreso de mascotas adoptadas.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.registerBtn}
          onClick={() => setIsRegisterOpen(true)}
        >
          Registrar Devolución
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="search"
            placeholder="Filtrar por mascota..."
            value={searchPet}
            onChange={(e) => setSearchPet(e.target.value)}
            aria-label="Filtrar por mascota"
          />
        </div>
        <div className={styles.searchBox}>
          <input
            type="search"
            placeholder="Filtrar por adoptante..."
            value={searchAdopter}
            onChange={(e) => setSearchAdopter(e.target.value)}
            aria-label="Filtrar por adoptante"
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No se encontraron registros de devoluciones.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Adoptante</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const petName = item.pet?.name || item.adoption?.pet?.name || 'Mascota'
                const adopterName = item.adopter?.firstName
                  ? `${item.adopter.firstName} ${item.adopter.lastName || ''}`
                  : item.adoption?.adopter?.firstName || 'Adoptante'
                return (
                  <tr key={item.id}>
                    <td>{petName}</td>
                    <td>{adopterName}</td>
                    <td>{item.reason}</td>
                    <td>{item.returnDate ? item.returnDate.slice(0, 10) : 'Reciente'}</td>
                    <td>
                      {isAdmin && (
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => {
                            setSelectedReturn(item)
                            setEditReasonText(item.reason || '')
                          }}
                        >
                          Modificar Motivo
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isRegisterOpen && (
        <ModalDialog onClose={() => setIsRegisterOpen(false)}>
          <h2 style={{ margin: '0 0 1rem' }}>Registrar Devolución de Mascota</h2>
          <form onSubmit={handleCreateReturn} className={styles.modalForm}>
            {registerError && <p style={{ color: 'red' }}>{registerError}</p>}
            <div>
              <label htmlFor="returnPetSelect">Mascota a devolver:</label>
              <select
                id="returnPetSelect"
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
              <label htmlFor="returnReasonText">Motivo detallado:</label>
              <textarea
                id="returnReasonText"
                placeholder="Describe el motivo y las condiciones del reingreso..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsRegisterOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.registerBtn}>
                Guardar Devolución
              </button>
            </div>
          </form>
        </ModalDialog>
      )}

      {selectedReturn && (
        <ModalDialog onClose={() => setSelectedReturn(null)}>
          <h2 style={{ margin: '0 0 1rem' }}>Modificar Motivo de Devolución</h2>
          <form onSubmit={handleUpdateReturn} className={styles.modalForm}>
            <div>
              <label htmlFor="editReasonTextarea">Motivo actualizado:</label>
              <textarea
                id="editReasonTextarea"
                value={editReasonText}
                onChange={(e) => setEditReasonText(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedReturn(null)}>
                Cancelar
              </button>
              <button type="submit" className={styles.registerBtn}>
                Guardar Cambios
              </button>
            </div>
          </form>
        </ModalDialog>
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
          title="Error en devolución"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}
    </section>
  )
}
