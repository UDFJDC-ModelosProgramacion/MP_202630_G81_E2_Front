
export const EDITABLE_FIELDS = ['specialization', 'availability']

export const REQUIRED_MESSAGES = {
    specialization: 'Selecciona una especialización.',
    availability: 'Selecciona una disponibilidad.',
}

const FIELD_BY_BACKEND_MESSAGE = {
    'Specialization cannot be null or empty': 'specialization',
    'Availability cannot be null or empty': 'availability',
}

export const fullName = ({ firstName, lastName }) =>
    [firstName, lastName].filter(Boolean).join(' ')

export const initialValues = (veterinarian) => ({
    specialization: veterinarian.specialization ?? '',
    availability: veterinarian.availability ?? '',
})


export function validateUpdate(values) {
    const errors = {}
    EDITABLE_FIELDS.forEach((field) => {
        if (!values[field].trim()) errors[field] = REQUIRED_MESSAGES[field]
    })
    return errors
}

export function buildUpdatePayload(values) {
    return {
        specialization: values.specialization.trim(),
        availability: values.availability.trim(),
    }
}


export const withCurrentOption = (options, current) =>
    current && !options.includes(current) ? [current, ...options] : options

export const fieldOfBackendMessage = (message) => FIELD_BY_BACKEND_MESSAGE[message] ?? null