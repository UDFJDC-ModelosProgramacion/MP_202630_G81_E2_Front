const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate user profile update inputs
export function validateUserProfileForm(values) {
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

  return errors
}

// Convert profile form into update DTO
export function toUserUpdatePayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone ? values.phone.trim() : '',
  }
}
