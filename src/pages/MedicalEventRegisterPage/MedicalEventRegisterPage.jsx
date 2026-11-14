import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { MEDICAL_EVENT_TYPES } from '../../constants/medicalEventOptions'
import { getSession, ROLES } from '../../config/session'
import { createMedicalEvent } from '../../services/medicalEventService'
import { getPets } from '../../services/petService'
import { getVeterinarians } from '../../services/veterinarianService'
import { formatDay, todayISO } from '../../utils/dates'
import {
  buildMedicalEventPayload,
  EMPTY_MEDICAL_EVENT,
  fieldOfBackendMessage,
  validateMedicalEvent,
} from './medicalEventForm'
import styles from './MedicalEventRegisterPage.module.css'

const ERROR_HINT =
  'Verifique los datos del evento antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const isActive = (record) => record.active !== false

const petLabel = (pet) => `${pet.name} — ${pet.species}`

const veterinarianLabel = ({ firstName = '', lastName = '', specialization }) => {
  const name = `Dr(a). ${firstName} ${lastName}`.trim()
  return specialization ? `${name} — ${specialization}` : name
}

const typeLabel = (value) =>
  MEDICAL_EVENT_TYPES.find((option) => option.value === value)?.label ?? value

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

function MedicalEventForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_MEDICAL_EVENT)
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [created, setCreated] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [options, setOptions] = useState({
    status: 'loading',
    pets: [],
    veterinarians: [],
    message: '',
  })
  const today = todayISO()
  const { status, pets, veterinarians, message } = options

  useEffect(() => {
    let mounted = true
    Promise.all([getPets(), getVeterinarians()])
      .then(([allPets, allVeterinarians]) => {
        if (!mounted) return
        setOptions({
          status: 'ready',
          pets: allPets.filter(isActive),
          veterinarians: allVeterinarians.filter(isActive),
          message: '',
        })
      })
      .catch((error) => {
        if (!mounted) return
        setOptions({ status: 'error', pets: [], veterinarians: [], message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [attempt])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKeys(current, [name]))
  }

  function retry() {
    setOptions((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  // A backend message is always shown in the dialog; when it belongs to a field it is also
  // marked next to it, and the focus goes there once the dialog is closed.
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
    setValues(EMPTY_MEDICAL_EVENT)
    setErrors({})
    setCreated(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateMedicalEvent(values, today)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const saved = await createMedicalEvent(buildMedicalEventPayload(values))
      const pet = pets.find((item) => String(item.id) === String(values.petId))
      const veterinarian = veterinarians.find(
        (item) => String(item.id) === String(values.veterinarianId),
      )
      setCreated({
        petId: saved?.pet?.id ?? Number(values.petId),
        petName: pet?.name ?? `#${values.petId}`,
        veterinarianName: veterinarian ? veterinarianLabel(veterinarian) : `#${values.veterinarianId}`,
        date: saved?.date ?? values.date,
        type: typeLabel(values.type),
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  const petOptions = pets.map((pet) => ({ value: String(pet.id), label: petLabel(pet) }))
  const veterinarianOptions = veterinarians.map((veterinarian) => ({
    value: String(veterinarian.id),
    label: veterinarianLabel(veterinarian),
  }))
  const missingPrerequisites = status === 'ready' && (pets.length === 0 || veterinarians.length === 0)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Registrar evento médico</h1>
        <p className={styles.subtitle}>
          Registra una consulta, cirugía o tratamiento en la historia médica de una mascota.
        </p>
      </header>

      {status === 'loading' && <ScreenState state="loading" message="Cargando mascotas y veterinarios..." />}

      {status === 'error' && (
        <>
          <ScreenState state="error" message={message} />
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      {missingPrerequisites && (
        <div>
          {pets.length === 0 && (
            <ScreenState
              state="empty"
              message="No hay mascotas activas registradas: registra una mascota antes de crear un evento médico."
            />
          )}
          {veterinarians.length === 0 && (
            <ScreenState
              state="empty"
              message="No hay veterinarios registrados: registra un veterinario antes de crear un evento médico."
            />
          )}
          <div className={styles.links}>
            {pets.length === 0 && <Link to="/pets/new">Registrar mascota</Link>}
            {veterinarians.length === 0 && <Link to="/veterinarians/new">Registrar veterinario</Link>}
          </div>
        </div>
      )}

      {status === 'ready' && !missingPrerequisites && (
        <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label="Registro de evento médico">
          <FormSection
            title="Datos del evento"
            description="La mascota y el veterinario deben existir; la fecha no puede ser futura."
          >
            <div className={styles.grid}>
              <SelectField
                id="petId"
                name="petId"
                label="Mascota"
                required
                options={petOptions}
                placeholder="Seleccione la mascota"
                value={values.petId}
                error={errors.petId}
                onChange={handleChange}
              />
              <SelectField
                id="veterinarianId"
                name="veterinarianId"
                label="Veterinario"
                required
                options={veterinarianOptions}
                placeholder="Seleccione el veterinario"
                value={values.veterinarianId}
                error={errors.veterinarianId}
                onChange={handleChange}
              />
              <TextField
                id="date"
                name="date"
                label="Fecha del evento (hasta hoy)"
                required
                type="date"
                max={today}
                value={values.date}
                error={errors.date}
                onChange={handleChange}
              />
              <SelectField
                id="type"
                name="type"
                label="Tipo de evento"
                required
                options={MEDICAL_EVENT_TYPES}
                placeholder="Seleccione el tipo"
                value={values.type}
                error={errors.type}
                onChange={handleChange}
              />
              <TextAreaField
                id="description"
                name="description"
                label="Descripción"
                required
                wide
                rows={4}
                value={values.description}
                error={errors.description}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          {submitting && <ScreenState state="loading" message="Registrando evento médico..." />}
          <FormActions
            submitLabel="Registrar evento"
            submitting={submitting}
            onCancel={() => navigate('/veterinarians')}
          />
        </form>
      )}

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar el evento médico"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/veterinarians')}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Evento médico registrado con éxito!"
          message={`El evento quedó guardado en la historia médica de "${created.petName}".`}
          details={[
            { label: 'Mascota', value: created.petName },
            { label: 'Veterinario', value: created.veterinarianName },
            { label: 'Fecha', value: formatDay(created.date) },
            { label: 'Tipo', value: created.type },
          ]}
          actionLabel="Ver la mascota"
          closeLabel="Registrar otro evento"
          onAction={() => navigate(`/pets/${created.petId}`)}
          onClose={registerAnother}
        />
      )}
    </section>
  )
}

export default function MedicalEventRegisterPage() {
  const session = getSession()
  const allowed = session.role === ROLES.SHELTER_ADMIN || session.role === ROLES.VETERINARIAN

  if (!allowed) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Registrar evento médico</h1>
        <ScreenState
          state="error"
          message="Solo el personal del refugio puede registrar eventos médicos."
        />
      </section>
    )
  }

  return <MedicalEventForm />
}
