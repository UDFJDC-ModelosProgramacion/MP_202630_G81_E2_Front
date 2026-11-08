import { useEffect, useState } from 'react'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import { TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession } from '../../config/session'
import { ROLE_LABELS } from '../../constants/roleLabels'
import { getUser, updateUser } from '../../services/userService'
import { matchUserBackendError } from '../UserRegisterPage/userForm'
import { toUserUpdatePayload, validateUserProfileForm } from './profileForm'
import styles from './UserProfilePage.module.css'

export default function UserProfilePage() {
  const session = getSession()
  const userId = session.userId || 1

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [successDialog, setSuccessDialog] = useState(false)
  const [errorDialog, setErrorDialog] = useState(null)

  useEffect(() => {
    let active = true
    getUser(userId)
      .then((data) => {
        if (!active) return
        setUser(data)
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        })
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setFetchError(err?.message || 'Error al cargar perfil de usuario')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  function handleStartEditing() {
    if (!user) return
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    })
    setErrors({})
    setIsEditing(true)
  }

  function handleCancel() {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validateUserProfileForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      const firstKey = Object.keys(clientErrors)[0]
      const el = document.getElementById(firstKey)
      if (el) el.focus()
      return
    }

    setSaving(true)
    try {
      const payload = toUserUpdatePayload(form)
      const updated = await updateUser(userId, payload)
      setUser(updated)
      setIsEditing(false)
      setSuccessDialog(true)
    } catch (err) {
      const backendMessage = err?.message || 'Error al actualizar el perfil'
      const matched = matchUserBackendError(backendMessage)
      if (matched.field) {
        setErrors((current) => ({ ...current, [matched.field]: matched.text }))
      }
      setErrorDialog(backendMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ScreenState state="loading" />
  }

  if (fetchError) {
    return <ScreenState state="error" message={fetchError} />
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          {(user?.firstName?.[0] || 'U') + (user?.lastName?.[0] || '')}
        </span>
        <div>
          <h1 className={styles.title}>{`${user?.firstName || ''} ${user?.lastName || ''}`}</h1>
          <span className={styles.roleBadge}>{ROLE_LABELS[session.role] || 'Usuario'}</span>
        </div>
      </header>

      <div className={styles.card}>
        {!isEditing ? (
          <div>
            <dl className={styles.detailsList}>
              <div className={styles.detailItem}>
                <dt>Nombre</dt>
                <dd>{user?.firstName || '-'}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Apellido</dt>
                <dd>{user?.lastName || '-'}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Correo Electrónico</dt>
                <dd>{user?.email || '-'}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Teléfono</dt>
                <dd>{user?.phone || 'No registrado'}</dd>
              </div>
            </dl>
            <button
              type="button"
              className={styles.editButton}
              onClick={handleStartEditing}
            >
              Editar Perfil
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormSection
              title="Editar Información de Contacto"
              description="Actualiza tus datos de contacto registrados."
            >
              <div className={styles.row}>
                <TextField
                  id="firstName"
                  name="firstName"
                  label="Nombre"
                  value={form.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <TextField
                  id="lastName"
                  name="lastName"
                  label="Apellido"
                  value={form.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>

              <TextField
                id="email"
                name="email"
                type="email"
                label="Correo Electrónico"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <TextField
                id="phone"
                name="phone"
                type="tel"
                label="Teléfono"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
              />
            </FormSection>

            <FormActions
              submitLabel={saving ? 'Guardando...' : 'Guardar Cambios'}
              submitting={saving}
              onCancel={handleCancel}
            />
          </form>
        )}
      </div>

      {successDialog && (
        <SuccessDialog
          title="¡Perfil actualizado!"
          message="Tus datos de contacto han sido actualizados satisfactoriamente."
          onClose={() => setSuccessDialog(false)}
          confirmLabel="Aceptar"
        />
      )}

      {errorDialog && (
        <ErrorDialog
          title="No se pudo actualizar el perfil"
          message={errorDialog}
          onClose={() => setErrorDialog(null)}
          actionLabel="Reintentar"
        />
      )}
    </section>
  )
}
