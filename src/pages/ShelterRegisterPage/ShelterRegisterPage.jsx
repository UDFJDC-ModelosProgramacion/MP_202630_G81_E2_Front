import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import { SelectField, TextField } from '../../components/FormField/FormField'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/session'
import { CITIES } from '../../constants/shelterOptions'
import { createShelter } from '../../services/shelterService'
import {
  buildShelterPayload,
  EMPTY_SHELTER,
  fieldOfBackendMessage,
  normalizeNit,
  validateShelter,
} from './shelterForm'
import styles from './ShelterRegisterPage.module.css'

const ERROR_HINT =
  'Verifique los datos institucionales antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const withoutKey = (object, key) => Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

function ShelterRegisterForm({ session }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_SHELTER)
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

  function registerAnother() {
    setValues(EMPTY_SHELTER)
    setErrors({})
    setCreated(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateShelter(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const shelter = await createShelter(buildShelterPayload(values, session.userId))
      setCreated({
        id: shelter.id,
        name: values.name.trim(),
        city: values.city,
        nit: normalizeNit(values.nit),
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  const field = (name, label) => ({
    id: name,
    name,
    label,
    value: values[name],
    error: errors[name],
    required: true,
    onChange: handleChange,
  })

  return (
    <section className={styles.page}>
      <header>
        <h1 className={styles.title}>Registre su Refugio</h1>
        <p className={styles.subtitle}>
          Complete los datos institucionales para administrar sus mascotas y eventos.
        </p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        aria-label="Registro de refugio"
      >
        <FormSection title="Datos del refugio" description="Todos los campos son obligatorios.">
          <div className={styles.grid}>
            <TextField {...field('name', 'Nombre del refugio')} placeholder="Patitas Felices" />
            <SelectField {...field('city', 'Ciudad')} options={CITIES} />
            <TextField {...field('nit', 'NIT')} placeholder="900.069.803-1" />
            <TextField {...field('location', 'Dirección')} placeholder="Carrera 15 # 85 - 32" />
          </div>
          <p className={styles.notice}>
            <strong>Aviso importante:</strong> al registrar el refugio, usted ({session.name}) queda
            como su administrador.
          </p>
        </FormSection>

        {submitting && <ScreenState state="loading" message="Registrando refugio..." />}
        <FormActions
          submitLabel="Registrar"
          submitting={submitting}
          onCancel={() => navigate('/shelters')}
        />
      </form>

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar el refugio"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/shelters')}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Refugio registrado con éxito!"
          message={`El refugio "${created.name}" ha sido creado satisfactoriamente.`}
          details={[
            { label: 'NIT', value: created.nit },
            { label: 'Ciudad', value: created.city },
            { label: 'Administrador asignado', value: session.name },
          ]}
          actionLabel="Ir al detalle del refugio"
          closeLabel="Registrar otro refugio"
          onAction={() => navigate(`/shelters/${created.id}`)}
          onClose={registerAnother}
        />
      )}
    </section>
  )
}

export default function ShelterRegisterPage() {
  const session = getSession()
  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Registre su Refugio</h1>
        <ScreenState
          state="error"
          message="Solo el administrador de un refugio puede registrar refugios."
        />
      </section>
    )
  }
  return <ShelterRegisterForm session={session} />
}