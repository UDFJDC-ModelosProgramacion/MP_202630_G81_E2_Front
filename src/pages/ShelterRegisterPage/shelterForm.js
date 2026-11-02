export const EMPTY_SHELTER = { name: '', city: '', nit: '', location: '' }

export const REQUIRED_SHELTER_FIELDS = ['name', 'city', 'nit', 'location']

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'

const isBlank = (value) => value.trim() === ''

export function validateShelter(values) {
  const errors = {}
  REQUIRED_SHELTER_FIELDS.filter((field) => isBlank(values[field])).forEach((field) => {
    errors[field] = REQUIRED_MESSAGE
  })
  return errors
}

export function buildShelterPayload(values, userId) {
  return {
    name: values.name.trim(),
    city: values.city,
    nit: values.nit.trim(),
    location: values.location.trim(),
    users: [{ id: userId }],
  }
}

const FIELD_BY_BACKEND_MESSAGE = {
  'Name cannot be null or empty': 'name',
  'City cannot be null or empty': 'city',
  'Nit cannot be null or empty': 'nit',
  'Location cannot be null or empty': 'location',
  'The nit is already registered for another shelter': 'nit',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}