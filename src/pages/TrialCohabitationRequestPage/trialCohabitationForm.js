import { dayStartISO } from '../../utils/dates'

export const EMPTY_TRIAL_REQUEST = {
  petId: '',
  startDate: '',
  endDate: '',
  description: '',
}
export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const PET_REQUIRED_MESSAGE = 'Selecciona la mascota para la convivencia de prueba.'
export const START_IN_PAST_MESSAGE = 'La fecha de inicio no puede ser anterior a hoy.'
export const END_BEFORE_START_MESSAGE = 'La fecha de fin no puede ser anterior a la fecha de inicio.'

const isBlank = (value) => String(value).trim() === ''

// The order of the keys is the order in which the fields are focused when the form is
// submitted with several errors at once.
export function validateTrialRequest(values, today) {
  const errors = {}

  if (isBlank(values.petId)) errors.petId = PET_REQUIRED_MESSAGE

  if (isBlank(values.startDate)) {
    errors.startDate = REQUIRED_MESSAGE
  } else if (values.startDate < today) {
    errors.startDate = START_IN_PAST_MESSAGE
  }

  if (isBlank(values.endDate)) {
    errors.endDate = REQUIRED_MESSAGE
  } else if (!isBlank(values.startDate) && values.endDate < values.startDate) {
    errors.endDate = END_BEFORE_START_MESSAGE
  }

  if (isBlank(values.description)) errors.description = REQUIRED_MESSAGE

  return errors
}

export function buildTrialRequestPayload(values, { today, adopterId, shelterId }) {
  return {
    date: dayStartISO(today),
    status: 'PENDING',
    description: values.description.trim(),
    startDate: dayStartISO(values.startDate),
    endDate: dayStartISO(values.endDate),
    shelter: { id: Number(shelterId) },
    adopter: { id: Number(adopterId) },
    pet: { id: Number(values.petId) },
  }
}

// Messages returned by TrialCohabitationRequestService in the back-end (HU29).
const FIELD_BY_BACKEND_MESSAGE = {
  'The start date cannot be earlier than the current date': 'startDate',
  'The trial cohabitation period must be defined with a start date and an end date': 'startDate',
  'The end date cannot be earlier than the start date': 'endDate',
  'Trial cohabitation request description cannot be null or empty': 'description',
  'The pet is not active in the system': 'petId',
  'The pet is not available for trial cohabitation': 'petId',
  'The pet with the given id was not found': 'petId',
  'The adopter already has an active trial cohabitation request for this pet': 'petId',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
