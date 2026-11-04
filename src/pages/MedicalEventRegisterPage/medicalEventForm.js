import { dayStartISO } from '../../utils/dates'

export const EMPTY_MEDICAL_EVENT = {
  date: '',
  type: '',
  description: '',
  petId: '',
  veterinarianId: '',
}
export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const FUTURE_DATE_MESSAGE = 'La fecha del evento no puede ser futura.'
export const PET_REQUIRED_MESSAGE = 'Selecciona la mascota del evento.'
export const VETERINARIAN_REQUIRED_MESSAGE = 'Selecciona el veterinario que atendió el evento.'

const isBlank = (value) => String(value).trim() === ''

// The order of the keys is the order in which the fields are focused when the form is
// submitted with several errors at once.
export function validateMedicalEvent(values, today) {
  const errors = {}

  if (isBlank(values.petId)) errors.petId = PET_REQUIRED_MESSAGE
  if (isBlank(values.veterinarianId)) errors.veterinarianId = VETERINARIAN_REQUIRED_MESSAGE

  if (isBlank(values.date)) {
    errors.date = REQUIRED_MESSAGE
  } else if (values.date > today) {
    errors.date = FUTURE_DATE_MESSAGE
  }

  if (isBlank(values.type)) errors.type = REQUIRED_MESSAGE
  if (isBlank(values.description)) errors.description = REQUIRED_MESSAGE

  return errors
}

export function buildMedicalEventPayload(values) {
  return {
    date: dayStartISO(values.date),
    type: values.type,
    description: values.description.trim(),
    pet: { id: Number(values.petId) },
    veterinarian: { id: Number(values.veterinarianId) },
  }
}

// Messages returned by MedicalEventService in the backend (see HU23 in the back repo).
const FIELD_BY_BACKEND_MESSAGE = {
  'Date is not valid': 'date',
  'Date cannot be in the future': 'date',
  'Type is not valid': 'type',
  'Description is not valid': 'description',
  'Pet is not valid': 'petId',
  'Pet was not found': 'petId',
  'The pet is not active in the system': 'petId',
  'Veterinarian is not valid': 'veterinarianId',
  'Veterinarian was not found': 'veterinarianId',
  'A medical event with the same pet, type and date already exists': 'type',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
