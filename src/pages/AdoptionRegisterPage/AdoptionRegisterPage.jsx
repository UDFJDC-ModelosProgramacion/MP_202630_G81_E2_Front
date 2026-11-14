import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { BACK_ADMIN_ROLE } from '../../constants/adoptionOptions'
import { getSession, ROLES } from '../../config/roleSession'
import { createAdoption } from '../../services/adoptionService'
import { getAdoptionRequests } from '../../services/adoptionRequestService'
import { getPets } from '../../services/petService'
import { formatDay } from '../../utils/dates'
import { adoptionStatusLabel, hasActiveAdoption } from '../../utils/adoptions'
import {
  buildAdoptionPayload,
  EMPTY_ADOPTION,
  fieldOfBackendMessage,
  validateAdoption,
} from './adoptionForm'
import styles from './AdoptionRegisterPage.module.css'

const ERROR_HINT =
  'Verifique los datos de la adopción antes de continuar o comuníquese con la administración si considera que se trata de un error.'

const adopterName = (adopter) =>
  `${adopter?.firstName ?? ''} ${adopter?.lastName ?? ''}`.trim() || 'Sin nombre'

const requestLabel = (request) => `${request.pet?.name} — ${adopterName(request.adopter)}`

// Only approved requests that can still become an adoption: not used yet, with an active adopter.
const isSelectable = (request) => !request.adoption && request.adopter?.active !== false

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

// The approved requests of the pets of the shelter that are still available for adoption.
function loadAvailableRequests(shelterId) {
  return getPets().then((allPets) => {
    const shelterPets = allPets.filter((pet) => pet.shelter?.id === shelterId)
    const availablePets = shelterPets.filter(
      (pet) => pet.active !== false && !hasActiveAdoption(pet),
    )
    return Promise.all(
      availablePets.map((pet) =>
        getAdoptionRequests({ petId: pet.id, status: 'APPROVED', currentUserRole: BACK_ADMIN_ROLE }),
      ),
    ).then((lists) => ({
      shelterPetCount: shelterPets.length,
      availablePetCount: availablePets.length,
      requests: lists.flat().filter(isSelectable),
    }))
  })
}

function AdoptionForm({ shelterId }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_ADOPTION)
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [registered, setRegistered] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [options, setOptions] = useState({
    status: 'loading',
    shelterPetCount: 0,
    availablePetCount: 0,
    requests: [],
    message: '',
  })
  const { status, shelterPetCount, availablePetCount, requests, message } = options

  useEffect(() => {
    let mounted = true
    loadAvailableRequests(shelterId)
      .then((loaded) => {
        if (mounted) setOptions({ status: 'ready', ...loaded, message: '' })
      })
      .catch((error) => {
        if (mounted) {
          setOptions({
            status: 'error',
            shelterPetCount: 0,
            availablePetCount: 0,
            requests: [],
            message: error.message,
          })
        }
      })
    return () => {
      mounted = false
    }
  }, [shelterId, attempt])

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

  // The request that was just used is no longer available, so the list is loaded again.
  function registerAnother() {
    setValues(EMPTY_ADOPTION)
    setErrors({})
    setRegistered(null)
    setOptions((current) => ({ ...current, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateAdoption(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    const request = requests.find((item) => String(item.id) === values.requestId)
    setSubmitting(true)
    try {
      const saved = await createAdoption(buildAdoptionPayload(values, request))
      setRegistered({
        petId: request.pet?.id,
        petName: request.pet?.name,
        adopter: adopterName(request.adopter),
        date: saved?.date ?? values.date,
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  const requestOptions = requests.map((request) => ({
    value: String(request.id),
    label: requestLabel(request),
  }))
  const noPets = status === 'ready' && shelterPetCount === 0
  const noAvailablePets = status === 'ready' && shelterPetCount > 0 && availablePetCount === 0
  const noRequests =
    status === 'ready' && availablePetCount > 0 && requests.length === 0

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Registrar adopción</h1>
        <p className={styles.subtitle}>
          Registra la adopción de una mascota de tu refugio a partir de una solicitud de adopción
          aprobada.
        </p>
      </header>

      {status === 'loading' && (
        <ScreenState state="loading" message="Cargando las solicitudes aprobadas..." />
      )}

      {status === 'error' && (
        <>
          <ScreenState state="error" message={message} />
          <button type="button" className={styles.retry} onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      {noPets && (
        <ScreenState state="empty" message="Tu refugio aún no tiene mascotas registradas." />
      )}

      {noAvailablePets && (
        <ScreenState
          state="empty"
          message="No hay mascotas disponibles para adopción en tu refugio."
        />
      )}

      {noRequests && (
        <ScreenState
          state="empty"
          message="No hay solicitudes de adopción aprobadas disponibles para registrar una adopción."
        />
      )}

      {status === 'ready' && requests.length > 0 && (
        <form
          className={styles.form}
          noValidate
          onSubmit={handleSubmit}
          aria-label="Registro de adopción"
        >
          <FormSection
            title="Datos de la adopción"
            description="La solicitud aprobada define la mascota y el adoptante."
          >
            <div className={styles.grid}>
              <SelectField
                id="requestId"
                name="requestId"
                label="Solicitud aprobada"
                required
                options={requestOptions}
                placeholder="Seleccione la solicitud"
                value={values.requestId}
                error={errors.requestId}
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
            <p className={styles.info}>
              Estado inicial: <strong>{adoptionStatusLabel('IN_PROGRESS')}</strong>
            </p>
          </FormSection>

          {submitting && <ScreenState state="loading" message="Registrando adopción..." />}
          <FormActions
            submitLabel="Registrar adopción"
            submitting={submitting}
            onCancel={() => navigate('/pets')}
          />
        </form>
      )}

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar la adopción"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
        />
      )}

      {registered && (
        <SuccessDialog
          title="¡Adopción registrada con éxito!"
          message={`La adopción de "${registered.petName}" por ${registered.adopter} quedó en curso.`}
          details={[
            { label: 'Mascota', value: registered.petName },
            { label: 'Adoptante', value: registered.adopter },
            { label: 'Fecha', value: formatDay(registered.date) },
            { label: 'Estado', value: adoptionStatusLabel('IN_PROGRESS') },
          ]}
          actionLabel="Ver la mascota"
          closeLabel="Registrar otra adopción"
          onAction={() => navigate(`/pets/${registered.petId}`)}
          onClose={registerAnother}
        />
      )}
    </section>
  )
}

export default function AdoptionRegisterPage() {
  const session = getSession()

  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Registrar adopción</h1>
        <ScreenState
          state="error"
          message="Solo el personal del refugio puede registrar adopciones."
        />
      </section>
    )
  }

  return <AdoptionForm shelterId={session.shelterId} />
}
