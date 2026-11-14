export const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

// Validate user registration form inputs
export function validateUserForm(values) {
  const errors = {}

  if (!values.firstName.trim()) {
    errors.firstName = 'El nombre es obligatorio'
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'El apellido es obligatorio'
  }

  if (!values.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Ingrese un correo electrónico válido'
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria'
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Debe confirmar su contraseña'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
  }

  return errors
}

// Convert user form values into DTO for API request
export function toUserPayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone ? values.phone.trim() : '',
    password: values.password,
  }
}

// Translate backend error messages to form fields
export function matchUserBackendError(message) {
  if (!message) return { field: null, text: '' }

  const lower = message.toLowerCase()
  if (lower.includes('email') || lower.includes('correo')) {
    return { field: 'email', text: message }
  }
  if (lower.includes('password') || lower.includes('contraseña')) {
    return { field: 'password', text: message }
  }
  if (lower.includes('firstname') || lower.includes('nombre')) {
    return { field: 'firstName', text: message }
  }
  if (lower.includes('lastname') || lower.includes('apellido')) {
    return { field: 'lastName', text: message }
  }
  if (lower.includes('phone') || lower.includes('teléfono')) {
    return { field: 'phone', text: message }
  }

  return { field: null, text: message }
}
