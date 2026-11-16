import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import { TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import { UserIcon } from '../../components/Icons/Icons'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import UserContactFields from '../../components/UserContactFields/UserContactFields'
import { createUser } from '../../services/userService'
import {
  EMPTY_USER_FORM,
  matchUserBackendError,
  toUserPayload,
  validateUserForm,
} from './userForm'
import styles from './UserRegisterPage.module.css'

export default function UserRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_USER_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [errorDialog, setErrorDialog] = useState(null)

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
    const clientErrors = validateUserForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      const firstKey = Object.keys(clientErrors)[0]
      const el = document.getElementById(firstKey)
      if (el) el.focus()
      return
    }

    setSubmitting(true)
    try {
      const payload = toUserPayload(form)
      const created = await createUser(payload)
      setCreatedUser(created)
    } catch (err) {
      const backendMessage = err?.message || 'Error de conexión con el servidor'
      const matched = matchUserBackendError(backendMessage)
      if (matched.field) {
        setErrors((current) => ({ ...current, [matched.field]: matched.text }))
      }
      setErrorDialog(backendMessage)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    void navigate(-1)
  }

  function handleSuccessClose() {
    setCreatedUser(null)
    void navigate('/veterinarians')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          <UserIcon className={styles.markIcon} />
        </span>
        <div>
          <h1 className={styles.title}>Crear Cuenta</h1>
          <p className={styles.subtitle}>
            Regístrate para solicitar adopciones o participar en la plataforma.
          </p>
        </div>
      </header>

      <form
        className={styles.form}
        onSubmit={(event) => { void handleSubmit(event) }}
        noValidate
      >
        <FormSection
          title="Datos Personales"
          description="Información básica requerida para tu perfil de usuario."
        >
          <UserContactFields
            values={form}
            errors={errors}
            onChange={handleChange}
            phoneLabel="Teléfono de Contacto"
          />
        </FormSection>

        <FormSection
          title="Seguridad de la Cuenta"
          description="Crea una contraseña segura de al menos 8 caracteres."
        >
          <div className={styles.row}>
            <TextField
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <TextField
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirmar Contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
          </div>
        </FormSection>

        <FormActions
          submitLabel={submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          submitting={submitting}
          onCancel={handleCancel}
        />
      </form>

      {createdUser && (
        <SuccessDialog
          title="¡Cuenta creada exitosamente!"
          message={`Bienvenido a Huellitas Seguras, ${createdUser.firstName}. Tu cuenta ha sido registrada correctamente.`}
          onClose={handleSuccessClose}
          confirmLabel="Continuar"
        />
      )}

      {errorDialog && (
        <ErrorDialog
          title="No se pudo crear la cuenta"
          message={errorDialog}
          onClose={() => setErrorDialog(null)}
          actionLabel="Reintentar"
        />
      )}
    </section>
  )
}
