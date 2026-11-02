import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import FormActions from '../../components/FormActions/FormActions'
import PhotoField from '../../components/PhotoField/PhotoField'
import ScreenState from '../../components/ScreenState/ScreenState'
import SuccessDialog from '../../components/SuccessDialog/SuccessDialog'
import { getSession, ROLES } from '../../config/session'
import { addPetPhoto, createPet } from '../../services/petService'
import { todayISO } from '../../utils/dates'
import { buildPhotoPayload, photoWarning, trySavePhoto } from '../../utils/photoForm'
import ArrivalEvents from './ArrivalEvents'
import PetFields from './PetFields'
import {
  buildPetPayload,
  EMPTY_EVENT,
  EMPTY_PET,
  fieldOfBackendMessage,
  updateValues,
  validatePet,
} from './petForm'
import styles from './PetRegisterPage.module.css'

const PHOTO_DESCRIPTION = 'Foto de perfil'
const ERROR_HINT =
  'Verifique los datos de la mascota antes de continuar o comuníquese con la administración si considera que se trata de un error.'

// Fields whose error must disappear together with the one that was edited.
const RELATED_FIELDS = { photoUrl: ['photoType'] }

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

const controlId = (key) => (key.startsWith('events.') ? key.replace('events.', 'event-').replaceAll('.', '-') : key)

function PetRegisterForm({ shelterId }) {
  const navigate = useNavigate()
  const nextEventUid = useRef(1)
  const [values, setValues] = useState(EMPTY_PET)
  const [events, setEvents] = useState([{ ...EMPTY_EVENT, uid: 0 }])
  const [errors, setErrors] = useState({})
  const [errorDialog, setErrorDialog] = useState(null)
  const [created, setCreated] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const today = todayISO()

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => updateValues(current, name, value))
    setErrors((current) => withoutKeys(current, [name, ...(RELATED_FIELDS[name] ?? [])]))
  }

  function handleEventChange(index, field, value) {
    setEvents((current) =>
      current.map((item, position) => (position === index ? { ...item, [field]: value } : item)),
    )
    setErrors((current) => withoutKeys(current, [`events.${index}.${field}`, 'events']))
  }

  function addEvent() {
    setEvents((current) => [...current, { ...EMPTY_EVENT, uid: nextEventUid.current++ }])
  }

  function removeEvent(index) {
    setEvents((current) => current.filter((_, position) => position !== index))
    setErrors({})
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
    if (field) document.getElementById(controlId(field))?.focus()
  }

  function registerAnother() {
    setValues(EMPTY_PET)
    setEvents([{ ...EMPTY_EVENT, uid: nextEventUid.current++ }])
    setErrors({})
    setCreated(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validatePet(values, events, today)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(controlId(firstInvalid))?.focus()
      return
    }

    setSubmitting(true)
    try {
      const pet = await createPet(buildPetPayload(values, events, shelterId))
      const photoError = await trySavePhoto(
        (photo) => addPetPhoto(pet.id, photo),
        buildPhotoPayload(values, PHOTO_DESCRIPTION),
      )
      setCreated({
        id: pet.id,
        name: values.name.trim(),
        species: values.species,
        breed: values.breed.trim(),
        admissionDate: values.admissionDate,
        warning: photoWarning(photoError),
      })
    } catch (error) {
      showBackendError(error)
    }
    setSubmitting(false)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Registre su Mascota</h1>
        <p className={styles.subtitle}>Complete la ficha de ingreso del nuevo rescate.</p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        aria-label="Registro de mascota"
      >
        <PhotoField values={values} errors={errors} onChange={handleChange} />
        <PetFields values={values} errors={errors} today={today} onChange={handleChange} />
        <ArrivalEvents
          events={events}
          errors={errors}
          onChange={handleEventChange}
          onAdd={addEvent}
          onRemove={removeEvent}
        />
        {submitting && <ScreenState state="loading" message="Registrando mascota..." />}
        <FormActions
          submitLabel="Registrar"
          submitting={submitting}
          onCancel={() => navigate('/pets')}
        />
      </form>

      {errorDialog && (
        <ErrorDialog
          title="Error al registrar la mascota"
          message={errorDialog.message}
          status={errorDialog.status}
          hint={ERROR_HINT}
          actionLabel="Modificar datos"
          onClose={closeErrorDialog}
          onCancel={() => navigate('/pets')}
        />
      )}

      {created && (
        <SuccessDialog
          title="¡Mascota registrada con éxito!"
          message={`"${created.name}" ha sido registrada satisfactoriamente en su refugio.`}
          details={[
            { label: 'Especie', value: created.species },
            { label: 'Raza', value: created.breed },
            { label: 'Fecha de ingreso', value: created.admissionDate },
          ]}
          warning={created.warning}
          actionLabel="Ir al perfil de la mascota"
          closeLabel="Registrar otra mascota"
          onAction={() => navigate(`/pets/${created.id}`)}
          onClose={registerAnother}
        />
      )}
    </section>
  )
}

export default function PetRegisterPage() {
  const session = getSession()
  if (session.role !== ROLES.SHELTER_ADMIN) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Registre su Mascota</h1>
        <ScreenState
          state="error"
          message="Solo el administrador de un refugio puede registrar mascotas."
        />
      </section>
    )
  }
  return <PetRegisterForm shelterId={session.shelterId} />
}