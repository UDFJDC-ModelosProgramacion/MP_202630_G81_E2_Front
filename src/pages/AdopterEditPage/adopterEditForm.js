import { REQUIRED_MESSAGE, INVALID_EARNINGS_MESSAGE } from '../AdopterRegisterPage/adopterForm'

// The backend only updates these fields; identity and contact data stay intact.
export const EDITABLE_FIELDS = [
  'address',
  'occupation',
  'earnings',
  'allergies',
  'housingType',
  'hasChildren',
  'hasOtherPets',
]

const isBlank = (value) => String(value ?? '').trim() === ''

const asBoolean = (value) => value === 'true'

export function toFormValues(adopter) {
  const asText = (value) => (value == null ? '' : String(value))
  return {
    address: asText(adopter.address),
    occupation: asText(adopter.occupation),
    earnings: asText(adopter.earnings),
    allergies: asText(adopter.allergies),
    housingType: asText(adopter.housingType),
    hasChildren: asText(adopter.hasChildren),
    hasOtherPets: asText(adopter.hasOtherPets),
  }
}

export function validateEditable(values) {
  const errors = {}
  EDITABLE_FIELDS.forEach((field) => {
    if (isBlank(values[field])) errors[field] = REQUIRED_MESSAGE
  })
  if (!errors.earnings && !(Number(values.earnings) > 0)) {
    errors.earnings = INVALID_EARNINGS_MESSAGE
  }
  return errors
}

export function buildUpdatePayload(values) {
  return {
    address: values.address.trim(),
    occupation: values.occupation.trim(),
    earnings: Number(values.earnings),
    allergies: values.allergies.trim(),
    housingType: values.housingType,
    hasChildren: asBoolean(values.hasChildren),
    hasOtherPets: asBoolean(values.hasOtherPets),
  }
}
