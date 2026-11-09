import { dayStartISO } from '../../utils/dates'

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'

const isBlank = (value) => String(value).trim() === ''

// The order of the keys is the order in which the fields are focused when the form is
// submitted with several errors at once.
export function validateAdoptionEdit(values) {
  const errors = {}
  if (isBlank(values.status)) errors.status = REQUIRED_MESSAGE
  if (isBlank(values.date)) errors.date = REQUIRED_MESSAGE
  if (isBlank(values.importantNotes)) errors.importantNotes = REQUIRED_MESSAGE
  return errors
}

// Only the status, the date, and the notes change. The pet and the adopter are not sent, so the
// back-end keeps them.
export function buildAdoptionEditPayload(values) {
  return {
    date: dayStartISO(values.date),
    status: values.status,
    importantNotes: values.importantNotes.trim(),
  }
}

// Messages returned by AdoptionService in the back-end (HU39).
const FIELD_BY_BACKEND_MESSAGE = {
  'A finalized or cancelled adoption cannot be modified': 'status',
  'Adoption status cannot be null or empty': 'status',
  'Adoption date cannot be null or empty': 'date',
  'Adoption important notes cannot be null or empty': 'importantNotes',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
