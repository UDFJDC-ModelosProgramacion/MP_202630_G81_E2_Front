import { dayStartISO } from '../../utils/dates'

export const EMPTY_ADOPTION = {
  requestId: '',
  date: '',
  importantNotes: '',
}
export const REQUEST_REQUIRED_MESSAGE = 'Selecciona la solicitud de adopción aprobada.'
export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'

const isBlank = (value) => String(value).trim() === ''

// The order of the keys is the order in which the fields are focused when the form is
// submitted with several errors at once.
export function validateAdoption(values) {
  const errors = {}
  if (isBlank(values.requestId)) errors.requestId = REQUEST_REQUIRED_MESSAGE
  if (isBlank(values.date)) errors.date = REQUIRED_MESSAGE
  if (isBlank(values.importantNotes)) errors.importantNotes = REQUIRED_MESSAGE
  return errors
}

// The approved adoption request defines the pet, the shelter and the adopter. The new
// adoption starts as IN_PROGRESS.
export function buildAdoptionPayload(values, request) {
  return {
    date: dayStartISO(values.date),
    status: 'IN_PROGRESS',
    importantNotes: values.importantNotes.trim(),
    pet: { id: request.pet.id },
    shelter: { id: request.pet.shelter.id },
    adopter: { id: request.adopter.id },
    adoptionRequest: { id: request.id },
  }
}

// Messages returned by AdoptionService in the back-end (HU35).
const FIELD_BY_BACKEND_MESSAGE = {
  'The pet is not active in the system': 'requestId',
  'The adopter is not active in the system': 'requestId',
  'The pet is not available for adoption': 'requestId',
  'An adoption already exists for this pet': 'requestId',
  'An adoption can only be created from an approved adoption request': 'requestId',
  'Unable to create adoption because the request already has one': 'requestId',
  'The adoption request with the given id was not found': 'requestId',
  'Adoption date cannot be null or empty': 'date',
  'Adoption important notes cannot be null or empty': 'importantNotes',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
