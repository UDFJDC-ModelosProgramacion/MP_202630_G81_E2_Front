import { detectPhotoFormat, validatePhoto } from '../../utils/photoForm'

export const EMPTY_PET = {
  name: '',
  species: '',
  breed: '',
  age: '',
  sex: '',
  size: '',
  healthStatus: '',
  admissionDate: '',
  activityLevel: '',
  requiredSpace: '',
  compatibilityChildren: '',
  compatibilityOtherPets: '',
  description: '',
  temperament: '',
  specificNeeds: '',
  photoUrl: '',
  photoType: '',
}

export const EMPTY_EVENT = { date: '', type: '', description: '' }

export const REQUIRED_PET_FIELDS = [
  'name',
  'species',
  'breed',
  'age',
  'sex',
  'size',
  'healthStatus',
  'admissionDate',
  'activityLevel',
  'requiredSpace',
  'compatibilityChildren',
  'compatibilityOtherPets',
]

const EVENT_FIELDS = ['date', 'type', 'description']

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const FUTURE_DATE_MESSAGE = 'La fecha de ingreso no puede ser futura.'
export const AGE_MESSAGE = 'La edad debe ser un número entero mayor o igual a 0.'

export const eventKey = (index, field) => `events.${index}.${field}`

const isBlank = (value) => String(value).trim() === ''

export function updateValues(values, name, value) {
  const updated = { ...values, [name]: value }
  if (name === 'photoUrl') updated.photoType = detectPhotoFormat(value) ?? values.photoType
  return updated
}

function validateAge(value) {
  if (isBlank(value)) return REQUIRED_MESSAGE
  const age = Number(value)
  return Number.isInteger(age) && age >= 0 ? null : AGE_MESSAGE
}

function validatePetField(field, values, today) {
  if (field === 'age') return validateAge(values.age)
  if (isBlank(values[field])) return REQUIRED_MESSAGE
  if (field === 'admissionDate' && values.admissionDate > today) return FUTURE_DATE_MESSAGE
  return null
}

export function validatePet(values, events, today) {
  const errors = validatePhoto(values)
  REQUIRED_PET_FIELDS.forEach((field) => {
    const message = validatePetField(field, values, today)
    if (message) errors[field] = message
  })
  events.forEach((event, index) => {
    EVENT_FIELDS.filter((field) => isBlank(event[field])).forEach((field) => {
      errors[eventKey(index, field)] = REQUIRED_MESSAGE
    })
  })
  return errors
}

const optionalText = (value) => (isBlank(value) ? null : value.trim())

export function buildPetPayload(values, events, shelterId) {
  return {
    name: values.name.trim(),
    species: values.species,
    breed: values.breed.trim(),
    age: Number(values.age),
    sex: values.sex,
    size: values.size,
    healthStatus: values.healthStatus.trim(),
    admissionDate: values.admissionDate,
    activityLevel: values.activityLevel,
    requiredSpace: values.requiredSpace,
    compatibilityChildren: values.compatibilityChildren === 'true',
    compatibilityOtherPets: values.compatibilityOtherPets === 'true',
    description: optionalText(values.description),
    temperament: optionalText(values.temperament),
    specificNeeds: optionalText(values.specificNeeds),
    shelter: { id: shelterId },
    medicalEvents: events.map(({ date, type, description }) => ({
      date,
      type,
      description: description.trim(),
    })),
  }
}

const FIELD_BY_BACKEND_MESSAGE = {
  'El nombre de la mascota no puede ser nulo ni estar vacío': 'name',
  'La especie no puede ser nula ni estar vacía': 'species',
  'La raza no puede ser nula ni estar vacía': 'breed',
  'La edad no puede ser nula': 'age',
  'El sexo no puede ser nulo ni estar vacío': 'sex',
  'El tamaño no puede ser nulo ni estar vacío': 'size',
  'El estado de salud no puede ser nulo ni estar vacío': 'healthStatus',
  'La fecha de ingreso no puede ser nula': 'admissionDate',
  'La fecha de ingreso no puede ser una fecha futura': 'admissionDate',
  'La compatibilidad con niños no puede ser nula': 'compatibilityChildren',
  'La compatibilidad con otras mascotas no puede ser nula': 'compatibilityOtherPets',
  'El nivel de actividad no puede ser nulo ni estar vacío': 'activityLevel',
  'El espacio requerido no puede ser nulo ni estar vacío': 'requiredSpace',
  'La mascota debe registrarse con al menos un evento de llegada que describa su ingreso al refugio':
    'events',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}