import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getFollowUp, updateFollowUp } from '../../services/followUpService'
import { formatDay } from '../../utils/dates'
import { dayOf } from '../../utils/followUpDates'
import {
  buildUpdatePayload,
  fieldOfFollowUpMessage,
  validateObservation,
} from '../FollowUpRegisterPage/followUpForm'
import styles from './FollowUpEditPage.module.css'

const ERROR_HINT =
  'Verifique la observación del seguimiento. Si el problema persiste, comuníquese con la administración.'

const withoutKey = (object, key) =>
  Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

function FollowUpEditForm({ adoptionId, followUp }) {
  const navigate = useNavigate()
  const listPath = `/adoptions/${adoptionId}/followUps`
  const [values, setValues] = useState({
    date: dayOf(followUp.date),
    observation: followUp.observation ?? '',
  })
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
    const found = validateObservation(values)
    setErrors(found)
    if (found.observation) {
      document.getElementById('observation')?.focus()
      return
    }

    setSubmitting(true)
    try {
      const updated = await updateFollowUp(adoptionId, followUp.id, buildUpdatePayload(values))
      setValues((current) => ({ ...current, observation: updated.observation }))
      setSaved(updated)
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  return (
    <>
      <header>
        <h1 className={styles.title}>Editar seguimiento</h1>
        <p className={styles.subtitle}>
          Adopción #{adoptionId}. Corrija la observación del seguimiento del{' '}
          {formatDay(followUp.date)}.
        </p>
      </header>

      {saved && (
        <section className={styles.success} role="status" aria-label="Seguimiento actualizado">
          <h2>Seguimiento actualizado</h2>
          <p>La observación se guardó correctamente.</p>
          <dl className={styles.summary}>
            <div>
              <dt>Fecha</dt>
              <dd>{formatDay(saved.date ?? followUp.date)}</dd>
            </div>
            <div>
              <dt>Observación</dt>
              <dd>{saved.observation}</dd>
            </div>
          </dl>
        </section>
      )}

      <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label="Edición de seguimiento">
        <FormSection
          title="Datos del seguimiento"
          description="La fecha no se puede modificar una vez creado el seguimiento."
        >
          <div className={styles.grid}>
            <TextField
              id="date"
              name="date"
              label="Fecha"
              type="date"
              disabled
              value={values.date}
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
          <p className={styles.hint}>
            Si la fecha fue un error, elimine el seguimiento y regístrelo de nuevo con la fecha
            correcta.
          </p>
        </FormSection>

        {submitting && <ScreenState state="loading" message="Guardando cambios..." />}

        <FormActions
          submitLabel="Guardar cambios"
          submitting={submitting}
          onCancel={() => navigate(listPath)}
        />
      </form>

      {errorDialog && (
        <ErrorDialog
          title="Error al actualizar el seguimiento"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate(listPath)}
        />
      )}
    </>
  )
}

export default function FollowUpEditPage() {
  const { adoptionId, followUpId } = useParams()
  const session = getSession()
  const isVeterinarian = session.role === ROLES.VETERINARIAN
  const [result, setResult] = useState({ status: 'loading', followUp: null, message: '' })

  useEffect(() => {
    if (!isVeterinarian) return undefined
    let cancelled = false
    getFollowUp(adoptionId, followUpId, { requesterId: session.userId, role: session.role })
      .then((followUp) => {
        if (!cancelled) setResult({ status: 'ready', followUp, message: '' })
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', followUp: null, message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [adoptionId, followUpId, isVeterinarian, session.role, session.userId])

  if (!isVeterinarian) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar seguimiento</h1>
        <ScreenState
          state="error"
          message="Solo el veterinario asignado a la adopción puede editar seguimientos."
        />
      </section>
    )
  }

  const { status, followUp, message } = result

  if (status === 'loading') {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar seguimiento</h1>
        <ScreenState state="loading" />
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar seguimiento</h1>
        <ScreenState state="error" message={message} />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <FollowUpEditForm adoptionId={adoptionId} followUp={followUp} />
    </section>
  )
}
