import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import ModalDialog, {
  DialogActions,
  DialogButton,
  DialogPill,
  DialogTitle,
} from '../../components/ModalDialog/ModalDialog'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/adopterSession'
import { deleteAdopter, getAdopter, updateAdopter } from '../../services/adopterService'
import { fieldOfBackendMessage } from '../AdopterRegisterPage/adopterForm'
import AdopterEditFields from './AdopterEditFields'
import { buildUpdatePayload, toFormValues, validateEditable } from './adopterEditForm'
import styles from './AdopterEditPage.module.css'

const ERROR_HINT =
  'Verifique sus datos antes de continuar. Si el problema persiste, comuníquese con la administración.'

const withoutKey = (object, key) =>
  Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

const fullName = ({ firstName = '', lastName = '' }) => `${firstName} ${lastName}`.trim()

function AdopterEditForm({ adopter }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(() => toFormValues(adopter))
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [saved, setSaved] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKey(current, name))
  }

  function showBackendError(error, hint) {
    const field = fieldOfBackendMessage(error.message)
    setErrors(field ? { [field]: error.message } : {})
    setErrorDialog({ message: error.message, status: error.status, field, hint })
  }

  function closeErrorDialog() {
    const { field } = errorDialog
    setErrorDialog(null)
    if (field) document.getElementById(field)?.focus()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAdopter(adopter.id)
      setConfirmingDelete(false)
      setDeleted(true)
    } catch (error) {
      setConfirmingDelete(false)
      showBackendError(
        error,
        'Si tiene solicitudes de adopción activas, desactive su cuenta en lugar de eliminarla.',
      )
    }
    setDeleting(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateEditable(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    setSaved(null)
    try {
      const updated = await updateAdopter(adopter.id, buildUpdatePayload(values))
      setValues(toFormValues(updated))
      setSaved({
        name: fullName(updated),
        address: updated.address,
        occupation: updated.occupation,
        housingType: updated.housingType,
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  return (
    <>
      <header>
        <h1 className={styles.title}>Editar mi perfil</h1>
        <p className={styles.subtitle}>
          Actualice su dirección, ocupación y datos del hogar. La identificación y el contacto no
          se modifican desde este formulario.
        </p>
      </header>

      <section className={styles.identity} aria-label="Datos de identidad">
        <h2>Datos de identidad</h2>
        <p>
          <strong>Nombre:</strong> {fullName(adopter)}
        </p>
        <p>
          <strong>Cédula:</strong> {adopter.nationalId}
        </p>
        <p>
          <strong>Correo:</strong> {adopter.email}
        </p>
        <p>
          <strong>Teléfono:</strong> {adopter.phone}
        </p>
      </section>

      {saved && (
        <section className={styles.success} role="status">
          <h2>Perfil actualizado</h2>
          <p>Los datos de {saved.name} se guardaron correctamente.</p>
          <dl className={styles.summary}>
            <div>
              <dt>Dirección</dt>
              <dd>{saved.address}</dd>
            </div>
            <div>
              <dt>Ocupación</dt>
              <dd>{saved.occupation}</dd>
            </div>
            <div>
              <dt>Vivienda</dt>
              <dd>{saved.housingType}</dd>
            </div>
          </dl>
        </section>
      )}

      <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label="Edición de adoptante">
        <AdopterEditFields values={values} errors={errors} onChange={handleChange} />
        {submitting && <ScreenState state="loading" message="Guardando cambios..." />}
        <FormActions
          submitLabel="Guardar cambios"
          submitting={submitting}
          onCancel={() => navigate('/')}
        />
      </form>

      <section className={styles.danger} aria-label="Eliminar cuenta">
        <h2>Eliminar mi cuenta</h2>
        <p>Si elimina su cuenta, su información personal dejará de aparecer en la plataforma.</p>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => setConfirmingDelete(true)}
        >
          Eliminar mi cuenta
        </button>
      </section>

      {errorDialog && (
        <ErrorDialog
          title="Error al actualizar el perfil"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={errorDialog.hint ?? ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/')}
        />
      )}

      {confirmingDelete && (
        <ModalDialog
          tone="error"
          role="alertdialog"
          labelledBy="delete-confirm-title"
          describedBy="delete-confirm-message"
          onClose={() => setConfirmingDelete(false)}
        >
          <DialogPill>Acción irreversible</DialogPill>
          <DialogTitle id="delete-confirm-title">Eliminar mi cuenta</DialogTitle>
          <p id="delete-confirm-message">
            ¿Seguro que desea eliminar la cuenta de {fullName(adopter)}? Esta acción no se puede
            deshacer.
          </p>
          <DialogActions>
            <DialogButton onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
            </DialogButton>
            <DialogButton variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </DialogButton>
          </DialogActions>
        </ModalDialog>
      )}

      {deleted && (
        <ModalDialog
          tone="success"
          role="dialog"
          labelledBy="delete-success-title"
          describedBy="delete-success-message"
          onClose={() => navigate('/')}
        >
          <DialogPill>Sesión cerrada</DialogPill>
          <DialogTitle id="delete-success-title">Cuenta eliminada</DialogTitle>
          <p id="delete-success-message">
            Su cuenta y sus datos personales han sido eliminados.
          </p>
          <DialogActions>
            <DialogButton onClick={() => navigate('/')}>Volver al inicio</DialogButton>
          </DialogActions>
        </ModalDialog>
      )}
    </>
  )
}

export default function AdopterEditPage() {
  const { adopterId } = useParams()
  const session = getSession()
  const isAdopter = session.role === ROLES.ADOPTER
  const isOwner = isAdopter && String(session.userId) === String(adopterId)
  const [result, setResult] = useState({ status: 'loading', adopter: null, message: '' })

  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    getAdopter(adopterId)
      .then((adopter) => {
        if (!cancelled) setResult({ status: 'ready', adopter, message: '' })
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', adopter: null, message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [adopterId, isOwner])

  const blockedMessage = !isAdopter
    ? 'Solo el adoptante puede editar su perfil.'
    : 'Solo puede editar su propio perfil.'

  if (!isOwner) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar mi perfil</h1>
        <ScreenState state="error" message={blockedMessage} />
      </section>
    )
  }

  const { status, adopter, message } = result

  if (status === 'loading') {
    return <ScreenState state="loading" />
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message={message} />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <AdopterEditForm adopter={adopter} />
    </section>
  )
}
