import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/adopterSession'
import { createAdopter } from '../../services/adopterService'
import AdopterFields from './AdopterFields'
import {
  buildAdopterPayload,
  EMPTY_ADOPTER,
  fieldOfBackendMessage,
  validateAdopter,
} from './adopterForm'
import styles from './AdopterRegisterPage.module.css'

const ERROR_HINT =
  'Verifique sus datos antes de continuar. Si el problema persiste, comuníquese con la administración.'

const withoutKey = (object, key) =>
  Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

function AdopterRegisterForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_ADOPTER)
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [created, setCreated] = useState(null)
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
    const found = validateAdopter(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const adopter = await createAdopter(buildAdopterPayload(values))
      setCreated({
        id: adopter.id,
        name: `${values.firstName.trim()} ${values.lastName.trim()}`,
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  return (
    <section className={styles.page}>
      <header>
        <h1 className={styles.title}>Regístrese como Adoptante</h1>
        <p className={styles.subtitle}>
          Complete sus datos personales, de contacto y hogar para solicitar cohabitaciones de
          prueba y adopciones.
        </p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        aria-label="Registro de adoptante"
      >
        <AdopterFields values={values} errors={errors} onChange={handleChange} />
        {submitting && <ScreenState state="loading" message="Registrando adoptante..." />}
        <FormActions
          submitLabel="Registrarme"
          submitting={submitting}
          onCancel={() => navigate('/')}
        />
      </form>

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar el adoptante"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/')}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Registro exitoso!"
          message={`Su perfil de adoptante "${created.name}" ha sido creado satisfactoriamente.`}
          details={[{ label: 'Id asignado', value: created.id }]}
          actionLabel="Buscar mascotas"
          closeLabel="Volver al inicio"
          onAction={() => navigate('/pets')}
          onClose={() => navigate('/')}
        />
      )}
    </section>
  )
}

export default function AdopterRegisterPage() {
  const session = getSession()
  if (session.role !== ROLES.VISITOR) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Regístrese como Adoptante</h1>
        <ScreenState
          state="error"
          message="Solo los visitantes pueden registrarse como adoptantes."
        />
      </section>
    )
  }
  return <AdopterRegisterForm />
}
