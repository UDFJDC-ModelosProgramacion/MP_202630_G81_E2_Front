import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/roleSession'
import { createFollowUp } from '../../services/followUpService'
import { formatDay } from '../../utils/dates'
import { todayISO } from '../../utils/followUpDates'
import {
  EMPTY_FOLLOW_UP,
  buildCreatePayload,
  fieldOfFollowUpMessage,
  validateFollowUp,
} from './followUpForm'
import styles from './FollowUpRegisterPage.module.css'

const ERROR_HINT =
  'Verifique los datos del seguimiento. Si el problema persiste, comuníquese con la administración.'

const withoutKey = (object, key) =>
  Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

function FollowUpRegisterForm({ adoptionId, veterinarianId }) {
  const navigate = useNavigate()
  const listPath = `/adoptions/${adoptionId}/followUps`
  const [values, setValues] = useState(EMPTY_FOLLOW_UP)
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
    const field = fieldOfFollowUpMessage(error.message)
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
    const found = validateFollowUp(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const followUp = await createFollowUp(
        adoptionId,
        buildCreatePayload(values, { adoptionId, veterinarianId }),
      )
      setCreated(followUp)
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  function resetForm() {
    setCreated(null)
    setValues(EMPTY_FOLLOW_UP)
    setErrors({})
  }

  return (
    <>
      <header>
        <h1 className={styles.title}>Registrar seguimiento</h1>
        <p className={styles.subtitle}>
          Adopción #{adoptionId}. Registre la fecha y la observación del seguimiento
          posadopción.
        </p>
      </header>

      <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label="Registro de seguimiento">
        <FormSection title="Datos del seguimiento" description="Ambos campos son obligatorios.">
          <div className={styles.grid}>
            <TextField
              id="date"
              name="date"
              label="Fecha"
              type="date"
              min={todayISO()}
              required
              value={values.date}
              error={errors.date}
              onChange={handleChange}
            />
            <TextAreaField
              id="observation"
              name="observation"
              label="Observación"
              wide
              rows={4}
              required
              value={values.observation}
              error={errors.observation}
              onChange={handleChange}
              placeholder="El adoptante reporta buena adaptación"
            />
          </div>
        </FormSection>

        {submitting && <ScreenState state="loading" message="Registrando seguimiento..." />}

        <FormActions
          submitLabel="Registrar seguimiento"
          submitting={submitting}
          onCancel={() => navigate(listPath)}
        />
      </form>

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar el seguimiento"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate(listPath)}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Seguimiento registrado!"
          message={`El seguimiento del ${formatDay(created.date ?? values.date)} se registró correctamente.`}
          details={[{ label: 'Observación', value: created.observation ?? values.observation.trim() }]}
          actionLabel="Ver seguimientos"
          closeLabel="Registrar otro"
          onAction={() => navigate(listPath)}
          onClose={resetForm}
        />
      )}
    </>
  )
}

export default function FollowUpRegisterPage() {
  const { adoptionId } = useParams()
  const session = getSession()
  if (session.role !== ROLES.VETERINARIAN) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Registrar seguimiento</h1>
        <ScreenState
          state="error"
          message="Solo el veterinario asignado a la adopción puede registrar seguimientos."
        />
      </section>
    )
  }
  return (
    <section className={styles.page}>
      <FollowUpRegisterForm adoptionId={adoptionId} veterinarianId={session.userId} />
    </section>
  )
}
