import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import { addPetPhoto, createPet } from '../../services/petService'
import { todayISO } from '../../utils/dates'
import ArrivalEvents from './ArrivalEvents'
import PetFields from './PetFields'
import PhotoField from './PhotoField'
import {
  buildPetPayload,
  EMPTY_EVENT,
  EMPTY_PET,
  fieldOfBackendMessage,
  updateValues,
  validatePet,
} from './petForm'
import { buildPhotoPayload } from './photoForm'
import styles from './PetRegisterPage.module.css'

const SUCCESS_NOTICE = 'Mascota registrada con éxito.'

// Fields whose error must disappear together with the one that was edited.
const RELATED_FIELDS = { photoUrl: ['photoType'] }

const withoutKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))

const controlId = (key) => (key.startsWith('events.') ? key.replace('events.', 'event-').replaceAll('.', '-') : key)

// The pet already exists when the photo is saved, so a failure here must not undo it:
// the message is returned (null when everything went well) and shown after the redirect.
async function savePhoto(petId, photo) {
  if (!photo) return null
  try {
    await addPetPhoto(petId, photo)
    return null
  } catch (error) {
    return error.message
  }
}

const noticeFor = (photoError) =>
  photoError
    ? `${SUCCESS_NOTICE.slice(0, -1)}, pero la foto no se pudo guardar: ${photoError}`
    : SUCCESS_NOTICE

function PetRegisterForm({ shelterId }) {
  const navigate = useNavigate()
  const nextEventUid = useRef(1)
  const [values, setValues] = useState(EMPTY_PET)
  const [events, setEvents] = useState([{ ...EMPTY_EVENT, uid: 0 }])
  const [errors, setErrors] = useState({})
  const [alertMessage, setAlertMessage] = useState('')
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

  function showBackendError(message) {
    const field = fieldOfBackendMessage(message)
    setErrors(field ? { [field]: message } : {})
    setAlertMessage(field ? '' : message)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validatePet(values, events, today)
    setAlertMessage('')
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(controlId(firstInvalid))?.focus()
      return
    }

    setSubmitting(true)
    try {
      const pet = await createPet(buildPetPayload(values, events, shelterId))
      const photoError = await savePhoto(pet.id, buildPhotoPayload(values))
      void navigate(`/pets/${pet.id}`, { state: { notice: noticeFor(photoError) } })
    } catch (error) {
      showBackendError(error.message)
      setSubmitting(false)
    }
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
        {alertMessage && <ScreenState state="error" message={alertMessage} />}
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
        <div className={styles.footer}>
          <p className={styles.hint}>*Campos obligatorios</p>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={() => navigate('/pets')}>
              Cancelar
            </button>
            <button type="submit" className={styles.submit} disabled={submitting}>
              Registrar
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

// Only the shelter administrator can register pets (CT3).
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
