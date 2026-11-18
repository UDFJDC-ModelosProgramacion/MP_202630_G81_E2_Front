import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import { UserIcon } from '../../components/Icons/Icons'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import useAuth from '../../auth/useAuth'
import { ROLE_LABELS } from '../../constants/roleLabels'
import { deleteUser, getAllUsers } from '../../services/userService'
import { filterUsers } from './usersDirectory'
import styles from './UsersDirectoryPage.module.css'

export default function UsersDirectoryPage() {
  const { session } = useAuth()
  const isAdmin = session?.role === 'SHELTER_ADMIN'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [userToDelete, setUserToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    getAllUsers('ADMIN')
      .then((data) => {
        if (!active) return
        setUsers(data || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Error al cargar directorio de usuarios')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message="Acceso denegado. Esta sección es exclusiva para administradores."
        />
      </section>
    )
  }

  if (loading) return <ScreenState state="loading" />
  if (error) return <ScreenState state="error" message={error} />

  const filtered = filterUsers(users, { search: searchTerm, role: roleFilter })

  async function handleConfirmDelete() {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setUserToDelete(null)
      setSuccessMessage('Usuario eliminado correctamente.')
    } catch (err) {
      setActionError(err?.message || 'No se pudo eliminar el usuario.')
      setUserToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          <UserIcon className={styles.markIcon} />
        </span>
        <div>
          <h1 className={styles.title}>Directorio de Usuarios</h1>
          <p className={styles.subtitle}>
            Administra las cuentas registradas en la plataforma de adopciones.
          </p>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>
        <div className={styles.roleFilter}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            <option value="SHELTER_ADMIN">Administrador de refugio</option>
            <option value="ADOPTER">Adoptante</option>
            <option value="VETERINARIAN">Veterinario</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No se encontraron usuarios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const role = u.role || (u.shelter ? 'SHELTER_ADMIN' : 'ADOPTER')
                return (
                  <tr key={u.id}>
                    <td>{`${u.firstName || ''} ${u.lastName || ''}`}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'No registrado'}</td>
                    <td>
                      <span className={styles.roleBadge}>{ROLE_LABELS[role] || role}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => setUserToDelete(u)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {userToDelete && (
        <ConfirmDialog
          title="¿Eliminar cuenta de usuario?"
          message={`¿Estás seguro de que deseas eliminar la cuenta de ${userToDelete.firstName} ${userToDelete.lastName}? Esta acción no se puede deshacer.`}
          confirmLabel={isDeleting ? 'Eliminando...' : 'Eliminar cuenta'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setUserToDelete(null)}
          loading={isDeleting}
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
          title="Error al eliminar cuenta"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}
    </section>
  )
}
