import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/roleSession'
import { getPets } from '../../services/petService'
import { createTrialCohabitationRequest } from '../../services/trialCohabitationService'
import { durationInDays, formatDay, todayISO } from '../../utils/dates'
import {
  buildTrialRequestPayload,
  EMPTY_TRIAL_REQUEST,
  fieldOfBackendMessage,
  validateTrialRequest,
} from './trialCohabitationForm'
import styles from './TrialCohabitationRequestPage.module.css'

const ERROR_HINT =
  'Verifique los datos de la solicitud antes de continuar o comuníquese con el refugio si considera que se trata de un error.'

const LIST_PATH = '/trial-cohabitation-requests'

const isActive = (record) => record.active !== false

const petLabel = (pet) => `${pet.name} — ${pet.species}`

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

const daysLabel = (days) => `${days} ${days === 1 ? 'día' : 'días'}`

function TrialCohabitationForm({ adopterId }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_TRIAL_REQUEST)
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [created, setCreated] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [options, setOptions] = useState({ status: 'loading', pets: [], message: '' })
  const today = todayISO()
  const { status, pets, message } = options
  const days = durationInDays(values.startDate, values.endDate)

  useEffect(() => {
    let mounted = true
    getPets()
      .then((allPets) => {
        if (!mounted) return
        setOptions({ status: 'ready', pets: allPets.filter(isActive), message: '' })
      })
      .catch((error) => {
        if (!mounted) return
        setOptions({ status: 'error', pets: [], message: error.message })
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
  function showError(error) {
    const field = fieldOfBackendMessage(error.message)
    setErrors(field ? { [field]: error.message } : {})
    setErrorDialog({ message: error.message, status: error.status, field })
  }

  function closeErrorDialog() {
    const { field } = errorDialog
    setErrorDialog(null)
    if (field) document.getElementById(field)?.focus()
  }

  function sendAnother() {
    setValues(EMPTY_TRIAL_REQUEST)
    setErrors({})
    setCreated(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateTrialRequest(values, today)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    const pet = pets.find((item) => String(item.id) === String(values.petId))
    if (!pet?.shelter?.id) {
      setErrorDialog({
        message: 'La mascota seleccionada no tiene un refugio asociado.',
        status: 0,
        field: 'petId',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = buildTrialRequestPayload(values, {
        today,
        adopterId,
        shelterId: pet.shelter.id,
      })
      const saved = await createTrialCohabitationRequest(payload)
      setCreated({
        petName: pet.name,
        shelterName: pet.shelter.name ?? `#${pet.shelter.id}`,
        startDate: saved?.startDate ?? values.startDate,
        endDate: saved?.endDate ?? values.endDate,
        days,
      })
    } catch (error) {
      showError(error)
    }
    setSubmitting(false)
  }

  const petOptions = pets.map((pet) => ({ value: String(pet.id), label: petLabel(pet) }))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Solicitar convivencia de prueba</h1>
        <p className={styles.subtitle}>
          Pide al refugio que una mascota disponible conviva contigo durante un periodo de prueba
          antes de adoptarla.
        </p>
      </header>

      {status === 'loading' && <ScreenState state="loading" message="Cargando mascotas..." />}

      {status === 'error' && (
        <>
          <ScreenState state="error" message={message} />
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      {status === 'ready' && pets.length === 0 && (
        <ScreenState
          state="empty"
          message="No hay mascotas activas disponibles para convivencia de prueba."
        />
      )}

      {status === 'ready' && pets.length > 0 && (
        <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label="Solicitud de convivencia de prueba">
          <FormSection
            title="Datos de la convivencia"
            description="La mascota debe estar activa y el periodo no puede empezar antes de hoy."
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
              <div className={styles.duration} aria-live="polite">
                {days && <p>Duración: {daysLabel(days)}</p>}
              </div>
              <TextField
                id="startDate"
                name="startDate"
                label="Fecha de inicio"
                required
                type="date"
                min={today}
                value={values.startDate}
                error={errors.startDate}
                onChange={handleChange}
              />
              <TextField
                id="endDate"
                name="endDate"
                label="Fecha de fin"
                required
                type="date"
                min={values.startDate || today}
                value={values.endDate}
                error={errors.endDate}
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

          {submitting && <ScreenState state="loading" message="Enviando solicitud..." />}
          <FormActions
            submitLabel="Enviar solicitud"
            submitting={submitting}
            onCancel={() => navigate(LIST_PATH)}
          />
        </form>
      )}

      {errorDialog && (
        <ErrorDialog
          title="Error al enviar la solicitud"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Solicitud de convivencia enviada con éxito!"
          message={`La solicitud quedó pendiente de revisión por el refugio "${created.shelterName}".`}
          details={[
            { label: 'Mascota', value: created.petName },
            { label: 'Desde', value: formatDay(created.startDate) },
            { label: 'Hasta', value: formatDay(created.endDate) },
            { label: 'Duración', value: daysLabel(created.days) },
            { label: 'Estado', value: 'Pendiente' },
          ]}
          actionLabel="Ver mis solicitudes"
          closeLabel="Enviar otra solicitud"
          onAction={() => navigate(LIST_PATH)}
          onClose={sendAnother}
        />
      )}
    </section>
  )
}

export default function TrialCohabitationRequestPage() {
  const session = getSession()

  if (session.role !== ROLES.ADOPTER) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Solicitar convivencia de prueba</h1>
        <ScreenState
          state="error"
          message="Solo los adoptantes pueden solicitar una convivencia de prueba."
        />
      </section>
    )
  }

  return <TrialCohabitationForm adopterId={session.userId} />
}
