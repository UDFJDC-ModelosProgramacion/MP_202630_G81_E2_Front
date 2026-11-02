import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/adopterSession'
import { getAdopter, updateAdopter } from '../../services/adopterService'
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

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKey(current, name))
  }

  function showBackendError(error) {
    const field = fieldOfBackendMessage(error.message)
    setErrors(field ? { [field]: error.message } : {})
    setErrorDialog({ message: error.message, status: error.status, field })
  }

  function closeErrorDialog() {
    const { field } = errorDialog
    setErrorDialog(null)
    if (field) document.getElementById(field)?.focus()
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

      {errorDialog && (
        <ErrorDialog
          title="Error al actualizar el perfil"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/')}
        />
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
