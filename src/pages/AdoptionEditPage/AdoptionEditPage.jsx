import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { ADOPTION_STATUSES } from '../../constants/adoptionOptions'
import { getSession, ROLES } from '../../config/roleSession'
import { getAdoption, updateAdoption } from '../../services/adoptionService'
import {
  adoptionStatusLabel,
  canEditAdoption,
  canViewAdoption,
  isClosedAdoption,
} from '../../utils/adoptions'
import { formatDay } from '../../utils/dates'
import {
  buildAdoptionEditPayload,
  fieldOfBackendMessage,
  validateAdoptionEdit,
} from './adoptionEditForm'
import styles from './AdoptionEditPage.module.css'

const ERROR_HINT =
  'Verifique los datos de la adopción antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const toInputDay = (value) => String(value ?? '').slice(0, 10)

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

function EditForm({ adoption }) {
  const navigate = useNavigate()
  const [values, setValues] = useState({
    status: adoption.status ?? '',
    date: toInputDay(adoption.date),
    importantNotes: adoption.importantNotes ?? '',
  })
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [updated, setUpdated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const detailPath = `/adoptions/${adoption.id}`
  const petName = adoption.pet?.name

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKeys(current, [name]))
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

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateAdoptionEdit(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      await updateAdoption(adoption.id, buildAdoptionEditPayload(values))
      setUpdated(true)
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  const statusOptions = ADOPTION_STATUSES.map(({ value, label }) => ({ value, label }))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Editar adopción</h1>
        <p className={styles.subtitle}>
          Actualiza el estado, la fecha o las notas importantes de la adopción. La mascota y el
          adoptante no se pueden cambiar.
        </p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        aria-label="Edición de adopción"
      >
        <FormSection
          title="Datos de la adopción"
          description="Una adopción finalizada o cancelada no se puede modificar después."
        >
          <div className={styles.grid}>
            <div className={styles.fixedField}>
              <span className={styles.fixedLabel}>Mascota y adoptante</span>
              <p className={styles.fixedValue}>
                {petName} — {adoption.pet?.species} · {adopterName(adoption.adopter)}
              </p>
              <p className={styles.hint}>La mascota y el adoptante no se pueden cambiar.</p>
            </div>
            <SelectField
              id="status"
              name="status"
              label="Estado de la adopción"
              required
              options={statusOptions}
              placeholder="Seleccione el estado"
              value={values.status}
              error={errors.status}
              onChange={handleChange}
            />
            <TextField
              id="date"
              name="date"
              label="Fecha de la adopción"
              required
              type="date"
              value={values.date}
              error={errors.date}
              onChange={handleChange}
            />
            <TextAreaField
              id="importantNotes"
              name="importantNotes"
              label="Notas importantes"
              required
              wide
              rows={4}
              value={values.importantNotes}
              error={errors.importantNotes}
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

      {errorDialog && (
        <ErrorDialog
          title="Error al actualizar la adopción"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
        />
      )}

      {updated && (
        <SuccessDialog
          title="¡Adopción actualizada con éxito!"
          message={`Los cambios de la adopción de "${petName}" quedaron guardados.`}
          details={[
            { label: 'Estado', value: adoptionStatusLabel(values.status) },
            { label: 'Fecha', value: formatDay(values.date) },
          ]}
          statusLabel="Código HTTP 200 • Actualizada con éxito"
          actionLabel="Ver detalle"
          closeLabel="Volver a las adopciones"
          onAction={() => navigate(detailPath)}
          onClose={() => navigate('/adoptions/shelter')}
        />
      )}
    </section>
  )
}

function AdoptionLoader({ adoptionId }) {
  const session = getSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', adoption: null, message: '' })

  useEffect(() => {
    let mounted = true
    getAdoption(adoptionId)
      .then((adoption) => {
        if (mounted) setResult({ status: 'ready', adoption, message: '' })
      })
      .catch((error) => {
        if (mounted) setResult({ status: 'error', adoption: null, message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [adoptionId, attempt])

  function retry() {
    setResult((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  const { status, adoption, message } = result
  const backLink = (
    <Link to={`/adoptions/${adoptionId}`} className={styles.backLink}>
      Volver al detalle de la adopción
    </Link>
  )

  if (status === 'loading') {
    return <ScreenState state="loading" message="Cargando la adopción..." />
  }

  if (status === 'error') {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message={message} />
        <div className={styles.toolbar}>
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
          {backLink}
        </div>
      </section>
    )
  }

  if (!canViewAdoption(adoption, session)) {
    return (
      <section className={styles.page}>
        <ScreenState state="error" message="No tienes acceso a esta adopción." />
        <div className={styles.toolbar}>{backLink}</div>
      </section>
    )
  }

  if (isClosedAdoption(adoption) || !canEditAdoption(adoption, session)) {
    return (
      <section className={styles.page}>
        <ScreenState
          state="error"
          message="Una adopción finalizada o cancelada no se puede modificar."
        />
        <div className={styles.toolbar}>{backLink}</div>
      </section>
    )
  }

  return <EditForm adoption={adoption} />
}

export default function AdoptionEditPage() {
  const { adoptionId } = useParams()
  const session = getSession()

  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Editar adopción</h1>
        <ScreenState state="error" message="Solo el personal del refugio puede editar adopciones." />
      </section>
    )
  }

  return <AdoptionLoader adoptionId={adoptionId} />
}
