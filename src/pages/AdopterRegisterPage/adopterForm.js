export const EMPTY_ADOPTER = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  nationalId: '',
  occupation: '',
  earnings: '',
  allergies: '',
  housingType: '',
  hasChildren: '',
  hasOtherPets: '',
}

export const REQUIRED_ADOPTER_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'password',
  'phone',
  'address',
  'nationalId',
  'occupation',
  'earnings',
  'allergies',
  'housingType',
  'hasChildren',
  'hasOtherPets',
]

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const INVALID_EARNINGS_MESSAGE = 'Ingrese un valor numérico mayor que cero.'

const isBlank = (value) => String(value).trim() === ''

const asBoolean = (value) => value === 'true'

export function validateAdopter(values) {
  const errors = {}
  REQUIRED_ADOPTER_FIELDS.forEach((field) => {
    if (isBlank(values[field])) errors[field] = REQUIRED_MESSAGE
  })
  if (!errors.earnings && !(Number(values.earnings) > 0)) {
    errors.earnings = INVALID_EARNINGS_MESSAGE
  }
  return errors
}

export function buildAdopterPayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    password: values.password,
    phone: values.phone.trim(),
    address: values.address.trim(),
    nationalId: values.nationalId.trim(),
    occupation: values.occupation.trim(),
    earnings: Number(values.earnings),
    allergies: values.allergies.trim(),
    housingType: values.housingType,
    hasChildren: asBoolean(values.hasChildren),
    hasOtherPets: asBoolean(values.hasOtherPets),
  }
}

const FIELD_BY_BACKEND_MESSAGE = {
  'First name cannot be null or empty': 'firstName',
  'Last name cannot be null or empty': 'lastName',
  'Email cannot be null or empty': 'email',
  'Password cannot be null or empty': 'password',
  'Phone cannot be null or empty': 'phone',
  'Address cannot be null or empty': 'address',
  'National id cannot be null or empty': 'nationalId',
  'Occupation cannot be null or empty': 'occupation',
  'Earnings cannot be null': 'earnings',
  'Housing type cannot be null or empty': 'housingType',
  'Allergies cannot be null or empty': 'allergies',
  'Has children cannot be null': 'hasChildren',
  'Has other pets cannot be null': 'hasOtherPets',
  'The user associated with this adopter already exists; this email is already registered': 'email',
  'An adopter with the same national id already exists': 'nationalId',
}

export function fieldOfBackendMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
