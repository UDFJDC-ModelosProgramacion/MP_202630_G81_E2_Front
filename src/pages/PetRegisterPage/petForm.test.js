import { describe, expect, it } from 'vitest'
import {
  AGE_MESSAGE,
  buildPetPayload,
  EMPTY_EVENT,
  EMPTY_PET,
  FUTURE_DATE_MESSAGE,
  fieldOfBackendMessage,
  REQUIRED_MESSAGE,
  validatePet,
} from './petForm'

const TODAY = '2026-10-28'

const VALID_PET = {
  ...EMPTY_PET,
  name: '  Luna ',
  species: 'Perro',
  breed: ' Criollo ',
  age: '3',
  sex: 'Hembra',
  size: 'Mediano',
  healthStatus: ' Saludable ',
  admissionDate: '2026-10-01',
  activityLevel: 'Alto',
  requiredSpace: 'Apartamento',
  compatibilityChildren: 'true',
  compatibilityOtherPets: 'false',
}
const VALID_EVENT = { date: '2026-10-01', type: 'Rescate', description: ' Rescatada en la calle ' }

describe('validatePet', () => {
  it('accepts a complete form without the optional fields', () => {
    expect(validatePet(VALID_PET, [VALID_EVENT], TODAY)).toEqual({})
  })

  it('requires every mandatory field and every field of the arrival event', () => {
    const errors = validatePet(EMPTY_PET, [EMPTY_EVENT], TODAY)

    expect(Object.keys(errors)).toEqual([
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
      'events.0.date',
      'events.0.type',
      'events.0.description',
    ])
    expect(errors.name).toBe(REQUIRED_MESSAGE)
  })

  it('treats blank text as missing', () => {
    expect(validatePet({ ...VALID_PET, name: '   ' }, [VALID_EVENT], TODAY).name).toBe(
      REQUIRED_MESSAGE,
    )
  })

  it('rejects an admission date after today but accepts today', () => {
    expect(
      validatePet({ ...VALID_PET, admissionDate: '2026-10-29' }, [VALID_EVENT], TODAY)
        .admissionDate,
    ).toBe(FUTURE_DATE_MESSAGE)
    expect(
      validatePet({ ...VALID_PET, admissionDate: TODAY }, [VALID_EVENT], TODAY).admissionDate,
    ).toBeUndefined()
  })

  it.each(['-1', '2.5', 'abc'])('rejects the age "%s"', (age) => {
    expect(validatePet({ ...VALID_PET, age }, [VALID_EVENT], TODAY).age).toBe(AGE_MESSAGE)
  })

  it('accepts an age of zero', () => {
    expect(validatePet({ ...VALID_PET, age: '0' }, [VALID_EVENT], TODAY).age).toBeUndefined()
  })

  it('validates each arrival event on its own', () => {
    const errors = validatePet(VALID_PET, [VALID_EVENT, { ...VALID_EVENT, type: '' }], TODAY)

    expect(errors).toEqual({ 'events.1.type': REQUIRED_MESSAGE })
  })
})

describe('buildPetPayload', () => {
  it('links the pet to the shelter and trims the texts', () => {
    const payload = buildPetPayload(VALID_PET, [VALID_EVENT], 7)

    expect(payload).toEqual({
      name: 'Luna',
      species: 'Perro',
      breed: 'Criollo',
      age: 3,
      sex: 'Hembra',
      size: 'Mediano',
      healthStatus: 'Saludable',
      admissionDate: '2026-10-01',
      activityLevel: 'Alto',
      requiredSpace: 'Apartamento',
      compatibilityChildren: true,
      compatibilityOtherPets: false,
      description: null,
      temperament: null,
      specificNeeds: null,
      shelter: { id: 7 },
      medicalEvents: [
        { date: '2026-10-01', type: 'Rescate', description: 'Rescatada en la calle' },
      ],
    })
  })

  it('sends the optional texts when they are filled', () => {
    const payload = buildPetPayload(
      { ...VALID_PET, description: ' Juguetona ', temperament: 'Sociable', specificNeeds: 'Ninguna' },
      [VALID_EVENT],
      1,
    )

    expect(payload.description).toBe('Juguetona')
    expect(payload.temperament).toBe('Sociable')
    expect(payload.specificNeeds).toBe('Ninguna')
  })

  it('does not leak the internal id of the events', () => {
    const payload = buildPetPayload(VALID_PET, [{ ...VALID_EVENT, uid: 4 }], 1)

    expect(payload.medicalEvents[0]).not.toHaveProperty('uid')
  })
})

describe('fieldOfBackendMessage', () => {
  it('maps the messages that belong to a field', () => {
    expect(fieldOfBackendMessage('Pet name cannot be null or empty')).toBe('name')
    expect(fieldOfBackendMessage('Admission date cannot be a future date')).toBe('admissionDate')
    expect(
      fieldOfBackendMessage(
        'A pet must be registered with at least one medical event describing its arrival at the shelter',
      ),
    ).toBe('events')
  })

  it('returns null for the messages that do not belong to a field', () => {
    expect(fieldOfBackendMessage('Pet must be associated with an existing shelter')).toBeNull()
    expect(fieldOfBackendMessage('The shelter with the given id was not found')).toBeNull()
  })
})
