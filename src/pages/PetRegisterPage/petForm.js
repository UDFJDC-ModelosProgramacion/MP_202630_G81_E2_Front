// Pure logic of the "register a pet" form (HU06): initial values, client validation,
// request payload and the mapping of backend messages to form fields.

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

// Returns { fieldName: message } with one entry per invalid field. It is empty when the
// form can be sent. The backend validates again (CT4).
export function validatePet(values, events, today) {
  const errors = {}
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

// Builds the body of POST /pets. The pet is linked to the administrator's shelter by id
// and travels with its arrival event(s).
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

// The backend reports one 412 message at a time. Those that belong to a field are shown
// next to it; any other message (shelter, duplicate pet, 404...) goes to the alert.
const FIELD_BY_BACKEND_MESSAGE = {
  'Pet name cannot be null or empty': 'name',
  'Species cannot be null or empty': 'species',
  'Breed cannot be null or empty': 'breed',
  'Age cannot be null': 'age',
  'Sex cannot be null or empty': 'sex',
  'Size cannot be null or empty': 'size',
  'Health status cannot be null or empty': 'healthStatus',
  'Admission date cannot be null': 'admissionDate',
  'Admission date cannot be a future date': 'admissionDate',
  'Compatibility with children cannot be null': 'compatibilityChildren',
  'Compatibility with other pets cannot be null': 'compatibilityOtherPets',
  'Activity level cannot be null or empty': 'activityLevel',
  'Required space cannot be null or empty': 'requiredSpace',
  'A pet must be registered with at least one medical event describing its arrival at the shelter':
    'events',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
