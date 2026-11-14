import { describe, expect, it } from 'vitest'
import {
  buildAdopterPayload,
  EMPTY_ADOPTER,
  fieldOfBackendMessage,
  INVALID_EARNINGS_MESSAGE,
  REQUIRED_ADOPTER_FIELDS,
  REQUIRED_MESSAGE,
  validateAdopter,
} from './adopterForm'

const validValues = {
  firstName: 'María Fernanda',
  lastName: 'Gómez Ruiz',
  email: 'maria@example.com',
  password: 'secret123',
  phone: '3001234567',
  address: 'Calle 45 # 20-30',
  nationalId: '1020304050',
  occupation: 'Ingeniera',
  earnings: '3500000',
  allergies: 'Ninguna',
  housingType: 'Casa',
  hasChildren: 'true',
  hasOtherPets: 'false',
}

describe('validateAdopter', () => {
  it('marks every field as required when the form is empty', () => {
    const errors = validateAdopter(EMPTY_ADOPTER)

    REQUIRED_ADOPTER_FIELDS.forEach((field) => {
      expect(errors[field]).toBe(REQUIRED_MESSAGE)
    })
    expect(Object.keys(errors)).toHaveLength(REQUIRED_ADOPTER_FIELDS.length)
  })

  it('accepts a complete adopter profile', () => {
    expect(validateAdopter(validValues)).toEqual({})
  })

  it('ignores whitespace-only values', () => {
    const errors = validateAdopter({ ...validValues, firstName: '   ' })

    expect(errors.firstName).toBe(REQUIRED_MESSAGE)
  })

  it.each(['0', '-10', 'abc'])('rejects an income of "%s"', (earnings) => {
    const errors = validateAdopter({ ...validValues, earnings })

    expect(errors.earnings).toBe(INVALID_EARNINGS_MESSAGE)
  })
})

describe('buildAdopterPayload', () => {
  it('trims text, converts the income and maps the yes/no answers to booleans', () => {
    const payload = buildAdopterPayload({
      ...validValues,
      firstName: '  María Fernanda  ',
      lastName: '  Gómez Ruiz ',
      email: ' maria@example.com ',
      address: ' Calle 45 # 20-30 ',
      nationalId: ' 1020304050 ',
      occupation: ' Ingeniera ',
      allergies: ' Ninguna ',
      password: 'secret123',
    })

    expect(payload).toEqual({
      firstName: 'María Fernanda',
      lastName: 'Gómez Ruiz',
      email: 'maria@example.com',
      password: 'secret123',
      phone: '3001234567',
      address: 'Calle 45 # 20-30',
      nationalId: '1020304050',
      occupation: 'Ingeniera',
      earnings: 3500000,
      allergies: 'Ninguna',
      housingType: 'Casa',
      hasChildren: true,
      hasOtherPets: false,
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it.each([
    ['First name cannot be null or empty', 'firstName'],
    ['Last name cannot be null or empty', 'lastName'],
    ['Email cannot be null or empty', 'email'],
    ['Password cannot be null or empty', 'password'],
    ['Phone cannot be null or empty', 'phone'],
    ['Address cannot be null or empty', 'address'],
    ['National id cannot be null or empty', 'nationalId'],
    ['Occupation cannot be null or empty', 'occupation'],
    ['Earnings cannot be null', 'earnings'],
    ['Housing type cannot be null or empty', 'housingType'],
    ['Allergies cannot be null or empty', 'allergies'],
    ['Has children cannot be null', 'hasChildren'],
    ['Has other pets cannot be null', 'hasOtherPets'],
    [
      'The user associated with this adopter already exists; this email is already registered',
      'email',
    ],
    ['An adopter with the same national id already exists', 'nationalId'],
  ])('maps "%s" to the "%s" field', (message, field) => {
    expect(fieldOfBackendMessage(message)).toBe(field)
  })

  it('returns null for messages without an associated field', () => {
    expect(fieldOfBackendMessage('Search filters cannot be empty')).toBeNull()
  })
})
