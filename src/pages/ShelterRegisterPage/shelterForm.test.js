import { describe, expect, it } from 'vitest'
import {
  buildShelterPayload,
  EMPTY_SHELTER,
  fieldOfBackendMessage,
  INVALID_NIT_MESSAGE,
  isValidNit,
  normalizeNit,
  REQUIRED_MESSAGE,
  validateShelter,
} from './shelterForm'

const VALID_SHELTER = {
  ...EMPTY_SHELTER,
  name: '  Patitas Felices ',
  city: 'Bogotá',
  nit: ' 900.069.803-1 ',
  location: ' Carrera 15 # 85 - 32 ',
}

describe('validateShelter', () => {
  it('accepts a complete form', () => {
    expect(validateShelter(VALID_SHELTER)).toEqual({})
  })

  it('requires the four fields, in the order of the screen', () => {
    const errors = validateShelter(EMPTY_SHELTER)

    expect(Object.keys(errors)).toEqual(['name', 'city', 'nit', 'location'])
    expect(errors.name).toBe(REQUIRED_MESSAGE)
  })

  it('treats blank text as missing', () => {
    expect(validateShelter({ ...VALID_SHELTER, nit: '   ' })).toEqual({ nit: REQUIRED_MESSAGE })
  })
})

describe('NIT', () => {
  it.each([
    '900.069.803-1',
    '900069803-1',
    '900.069.803',
    '900069803',
    '80.012.345-6',
    '1.234.567.890-1',
    ' 900.069.803-1 ',
  ])('accepts "%s"', (nit) => {
    expect(isValidNit(nit)).toBe(true)
    expect(validateShelter({ ...VALID_SHELTER, nit })).toEqual({})
  })

  it.each([
    'p',
    'abc',
    '123',
    '9000698',
    '12345678901',
    '900.069',
    '900.0690.803',
    '9.00.069.803',
    '900-069-803',
    '900069803-12',
    '900069803-',
    '900.069.803-A',
    '900 069 803',
  ])('rejects "%s" with a message that shows the expected format', (nit) => {
    expect(isValidNit(nit)).toBe(false)
    expect(validateShelter({ ...VALID_SHELTER, nit })).toEqual({ nit: INVALID_NIT_MESSAGE })
  })

  it('still reports an empty NIT as required, not as invalid', () => {
    expect(validateShelter({ ...VALID_SHELTER, nit: '' })).toEqual({ nit: REQUIRED_MESSAGE })
  })

  it('is sent without dots so the same NIT is never registered twice', () => {
    expect(normalizeNit(' 900.069.803-1 ')).toBe('900069803-1')
    expect(normalizeNit('1.234.567.890')).toBe('1234567890')
  })
})

describe('buildShelterPayload', () => {
  it('trims the text and sends the responsible user in the users list', () => {
    expect(buildShelterPayload(VALID_SHELTER, 7)).toEqual({
      name: 'Patitas Felices',
      city: 'Bogotá',
      nit: '900069803-1',
      location: 'Carrera 15 # 85 - 32',
      users: [{ id: 7 }],
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it.each([
    ['El nombre no puede ser nulo ni estar vacío', 'name'],
    ['La ciudad no puede ser nula ni estar vacía', 'city'],
    ['La dirección no puede ser nula ni estar vacía', 'location'],
    ['El NIT no puede ser nulo ni estar vacío', 'nit'],
    ['El NIT ya está registrado para otro refugio', 'nit'],
  ])('shows "%s" next to the %s field', (message, field) => {
    expect(fieldOfBackendMessage(message)).toBe(field)
  })

  it.each([
    'Ya existe un refugio con el mismo nombre, ciudad y dirección',
    'El refugio debe estar asociado a al menos un usuario responsable de su administración',
  ])('leaves "%s" for the error dialog', (message) => {
    expect(fieldOfBackendMessage(message)).toBeNull()
  })
})