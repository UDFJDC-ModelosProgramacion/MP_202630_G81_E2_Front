export const EMPTY_SHELTER = { name: '', city: '', nit: '', location: '' }

export const REQUIRED_SHELTER_FIELDS = ['name', 'city', 'nit', 'location']

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const INVALID_NIT_MESSAGE = 'Ingrese un NIT válido, por ejemplo 900.069.803-1.'

const NIT_PATTERN = /^(\d{8,10}|\d{2,3}(\.\d{3}){2}|\d(\.\d{3}){3})(-\d)?$/

const isBlank = (value) => value.trim() === ''

export const isValidNit = (value) => NIT_PATTERN.test(value.trim())

export const normalizeNit = (value) => value.trim().replaceAll('.', '')

function fieldError(field, value) {
  if (isBlank(value)) return REQUIRED_MESSAGE
  if (field === 'nit' && !isValidNit(value)) return INVALID_NIT_MESSAGE
  return null
}

export function validateShelter(values) {
  const errors = {}
  REQUIRED_SHELTER_FIELDS.forEach((field) => {
    const message = fieldError(field, values[field])
    if (message) errors[field] = message
  })
  return errors
}

export function buildShelterPayload(values, userId) {
  return {
    name: values.name.trim(),
    city: values.city,
    nit: normalizeNit(values.nit),
    location: values.location.trim(),
    users: [{ id: userId }],
  }
}

const FIELD_BY_BACKEND_MESSAGE = {
  'El nombre no puede ser nulo ni estar vacío': 'name',
  'La ciudad no puede ser nula ni estar vacía': 'city',
  'El NIT no puede ser nulo ni estar vacío': 'nit',
  'La dirección no puede ser nula ni estar vacía': 'location',
  'El NIT ya está registrado para otro refugio': 'nit',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}