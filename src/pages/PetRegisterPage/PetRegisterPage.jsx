import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import { createPet } from '../../services/petService'
import { todayISO } from '../../utils/dates'
import ArrivalEvents from './ArrivalEvents'
import PetFields from './PetFields'
import {
  buildPetPayload,
  EMPTY_EVENT,
  EMPTY_PET,
  fieldOfBackendMessage,
  validatePet,
} from './petForm'
import styles from './PetRegisterPage.module.css'

const withoutKey = (object, key) => Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

const controlId = (key) => (key.startsWith('events.') ? key.replace('events.', 'event-').replaceAll('.', '-') : key)

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
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => withoutKey(current, name))
  }

  function handleEventChange(index, field, value) {
    setEvents((current) =>
      current.map((item, position) => (position === index ? { ...item, [field]: value } : item)),
    )
    setErrors((current) => withoutKey(withoutKey(current, `events.${index}.${field}`), 'events'))
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
      void navigate(`/pets/${pet.id}`, { state: { notice: 'Mascota registrada con éxito.' } })
    } catch (error) {
      showBackendError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Registre su Mascota</h1>

      <form noValidate onSubmit={handleSubmit} aria-label="Registro de mascota">
        {alertMessage && <ScreenState state="error" message={alertMessage} />}
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
          <button type="submit" className={styles.submit} disabled={submitting}>
            Registrar
          </button>
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
      <section className={styles.panel}>
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