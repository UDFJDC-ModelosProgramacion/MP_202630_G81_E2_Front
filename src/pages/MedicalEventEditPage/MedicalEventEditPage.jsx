import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { MEDICAL_EVENT_TYPES } from '../../constants/medicalEventOptions'
import { getSession, ROLES } from '../../config/session'
import { getMedicalEvent, updateMedicalEvent } from '../../services/medicalEventService'
import { getVeterinarians } from '../../services/veterinarianService'
import { formatDay, todayISO } from '../../utils/dates'
import { petSummary } from '../../utils/medicalEvents'
import {
  buildMedicalEventPayload,
  fieldOfBackendMessage,
  validateMedicalEvent,
} from '../MedicalEventRegisterPage/medicalEventForm'
import styles from './MedicalEventEditPage.module.css'

const ERROR_HINT =
  'Verifique los datos del evento antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const isActive = (record) => record.active !== false

const toInputDay = (value) => String(value ?? '').slice(0, 10)

const veterinarianLabel = ({ firstName = '', lastName = '', specialization }) => {
  const name = `Dr(a). ${firstName} ${lastName}`.trim()
  return specialization ? `${name} — ${specialization}` : name
}

const typeLabel = (value) =>
  MEDICAL_EVENT_TYPES.find((option) => option.value === value)?.label ?? value

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

function MedicalEventForm() {
  const { medicalEventId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [values, setValues] = useState(null)
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [updated, setUpdated] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    status: 'loading',
    medicalEvent: null,
    veterinarians: [],
    message: '',
  })
  const today = todayISO()
  const { status, medicalEvent, veterinarians, message } = data

  useEffect(() => {
    let mounted = true
    Promise.all([getMedicalEvent(medicalEventId), getVeterinarians()])
      .then(([event, allVeterinarians]) => {
        if (!mounted) return
        setValues({
          date: toInputDay(event.date),
          type: event.type ?? '',
          description: event.description ?? '',
          petId: event.pet?.id != null ? String(event.pet.id) : '',
          veterinarianId:
            event.veterinarian?.id != null ? String(event.veterinarian.id) : '',
        })
        setData({
          status: 'ready',
          medicalEvent: event,
          veterinarians: allVeterinarians.filter(isActive),
          message: '',
        })
      })
      .catch((error) => {
        if (!mounted) return
        setData({ status: 'error', medicalEvent: null, veterinarians: [], message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [medicalEventId, attempt])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKeys(current, [name]))
  }

  function retry() {
    setData((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
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
    const found = validateMedicalEvent(values, today)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const saved = await updateMedicalEvent(medicalEventId, buildMedicalEventPayload(values))
      const veterinarian = veterinarians.find(
        (item) => String(item.id) === String(values.veterinarianId),
      )
      setUpdated({
        petId: saved?.pet?.id ?? Number(values.petId),
        petName: petSummary(saved?.pet ?? medicalEvent?.pet),
        veterinarianName: veterinarian
          ? veterinarianLabel(veterinarian)
          : `#${values.veterinarianId}`,
        date: saved?.date ?? values.date,
        type: typeLabel(saved?.type ?? values.type),
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  const detailPath = `/medical-events/${medicalEventId}`
  const historyPath = medicalEvent?.pet?.id ? `/pets/${medicalEvent.pet.id}/medical-events` : '/pets'

  if (status === 'loading') {
    return (
      <section className={styles.page}>
        <ScreenState state="loading" message="Cargando el evento médico..." />
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message={message} />
        <button type="button" className={styles.retry} onClick={retry}>
          Reintentar
        </button>
        <Link to="/pets">Volver a mascotas</Link>
      </section>
    )
  }

  if (!values || !medicalEvent) return null

  const veterinarianOptions = veterinarians.map((veterinarian) => ({
    value: String(veterinarian.id),
    label: veterinarianLabel(veterinarian),
  }))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Editar evento médico</h1>
        <p className={styles.subtitle}>
          Actualiza la fecha, el tipo, la descripción o el veterinario del evento. La mascota no
          se puede cambiar.
        </p>
      </header>

      {veterinarians.length === 0 && (
        <div>
          <ScreenState
            state="empty"
            message="No hay veterinarios registrados: registra un veterinario antes de editar el evento."
          />
          <div className={styles.links}>
            <Link to="/veterinarians/new">Registrar veterinario</Link>
          </div>
        </div>
      )}

      {veterinarians.length > 0 && (
        <form
          className={styles.form}
          noValidate
          onSubmit={handleSubmit}
          aria-label="Edición de evento médico"
        >
          <FormSection
            title="Datos del evento"
            description="El veterinario debe existir; la fecha no puede ser futura."
          >
            <div className={styles.grid}>
              <div className={styles.fixedField}>
                <span className={styles.fixedLabel}>Mascota</span>
                <p className={styles.fixedValue}>{petSummary(medicalEvent.pet)}</p>
                <p className={styles.hint}>La mascota no se puede cambiar.</p>
              </div>
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

          {submitting && <ScreenState state="loading" message="Guardando cambios..." />}
          <FormActions
            submitLabel="Guardar cambios"
            submitting={submitting}
            onCancel={() => navigate(detailPath)}
          />
        </form>
      )}

      {errorDialog && (
        <ErrorDialog
          title="Error al actualizar el evento médico"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate(detailPath)}
        />
      )}

      {updated && (
        <SuccessDialog
          title="¡Evento médico actualizado con éxito!"
          message={`Los cambios quedaron guardados en la historia médica de "${updated.petName}".`}
          details={[
            { label: 'Mascota', value: updated.petName },
            { label: 'Veterinario', value: updated.veterinarianName },
            { label: 'Fecha', value: formatDay(updated.date) },
            { label: 'Tipo', value: updated.type },
          ]}
          statusLabel="Código HTTP 200 • Actualizado con éxito"
          actionLabel="Ver detalle"
          closeLabel="Volver a la historia"
          onAction={() => navigate(detailPath)}
          onClose={() => navigate(historyPath)}
        />
      )}
    </section>
  )
}

export default function MedicalEventEditPage() {
  const session = getSession()
  const allowed = session.role === ROLES.SHELTER_ADMIN || session.role === ROLES.VETERINARIAN

  if (!allowed) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar evento médico</h1>
        <ScreenState
          state="error"
          message="Solo el personal del refugio puede editar eventos médicos."
        />
      </section>
    )
  }

  return <MedicalEventForm />
}
