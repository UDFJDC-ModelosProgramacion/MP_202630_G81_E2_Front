import { describe, expect, it } from 'vitest'
import {
  buildShelterPayload,
  EMPTY_SHELTER,
  fieldOfBackendMessage,
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

describe('buildShelterPayload', () => {
  it('trims the text and sends the responsible user in the users list', () => {
    expect(buildShelterPayload(VALID_SHELTER, 7)).toEqual({
      name: 'Patitas Felices',
      city: 'Bogotá',
      nit: '900.069.803-1',
      location: 'Carrera 15 # 85 - 32',
      users: [{ id: 7 }],
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it.each([
    ['Name cannot be null or empty', 'name'],
    ['City cannot be null or empty', 'city'],
    ['Location cannot be null or empty', 'location'],
    ['Nit cannot be null or empty', 'nit'],
    ['The nit is already registered for another shelter', 'nit'],
  ])('shows "%s" next to the %s field', (message, field) => {
    expect(fieldOfBackendMessage(message)).toBe(field)
  })

  it.each([
    'A shelter already exists with the same name, city and location',
    'A shelter must be associated with at least one user responsible for its administration',
  ])('leaves "%s" for the error dialog', (message) => {
    expect(fieldOfBackendMessage(message)).toBeNull()
  })
})