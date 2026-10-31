const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_SEPARATORS = /[\s()+-]/g
const PHONE_DIGITS = /^\d{7,15}$/

export const EMPTY_VETERINARIAN = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    availability: '',
}


export function validateVeterinarian(values) {
    const errors = {}

    if (!values.firstName.trim()) errors.firstName = 'El nombre es obligatorio.'
    if (!values.lastName.trim()) errors.lastName = 'El apellido es obligatorio.'

    if (!values.email.trim()) {
        errors.email = 'El correo es obligatorio.'
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
        errors.email = 'Ingresa un correo válido.'
    }

    if (!values.phone.trim()) {
        errors.phone = 'El teléfono es obligatorio.'
    } else if (!PHONE_DIGITS.test(values.phone.replace(PHONE_SEPARATORS, ''))) {
        errors.phone = 'Ingresa un teléfono válido (entre 7 y 15 dígitos).'
    }

    if (!values.specialization) errors.specialization = 'Selecciona una especialización.'
    if (!values.availability) errors.availability = 'Selecciona una disponibilidad.'

    return errors
}