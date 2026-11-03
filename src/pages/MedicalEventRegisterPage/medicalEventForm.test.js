import { describe, expect, it } from 'vitest'
import {
  buildMedicalEventPayload,
  EMPTY_MEDICAL_EVENT,
  fieldOfBackendMessage,
  FUTURE_DATE_MESSAGE,
  PET_REQUIRED_MESSAGE,
  REQUIRED_MESSAGE,
  validateMedicalEvent,
  VETERINARIAN_REQUIRED_MESSAGE,
} from './medicalEventForm'

const TODAY = '2026-11-02'

const VALID_EVENT = {
  date: '2026-10-01',
  type: 'Cirugia',
  description: 'Esterilización sin complicaciones',
  petId: '1',
  veterinarianId: '5',
}

describe('validateMedicalEvent', () => {
  it('marks every mandatory field when the form is empty', () => {
    const errors = validateMedicalEvent(EMPTY_MEDICAL_EVENT, TODAY)

    expect(errors).toEqual({
      petId: PET_REQUIRED_MESSAGE,
      veterinarianId: VETERINARIAN_REQUIRED_MESSAGE,
      date: REQUIRED_MESSAGE,
      type: REQUIRED_MESSAGE,
      description: REQUIRED_MESSAGE,
    })
  })

  it('rejects a date in the future', () => {
    const errors = validateMedicalEvent({ ...VALID_EVENT, date: '2026-11-03' }, TODAY)

    expect(errors.date).toBe(FUTURE_DATE_MESSAGE)
  })

  it('accepts an event dated today or earlier', () => {
    expect(validateMedicalEvent({ ...VALID_EVENT, date: TODAY }, TODAY)).toEqual({})
    expect(validateMedicalEvent(VALID_EVENT, TODAY)).toEqual({})
  })

  it('rejects a whitespace-only description', () => {
    const errors = validateMedicalEvent({ ...VALID_EVENT, description: '   ' }, TODAY)

    expect(errors.description).toBe(REQUIRED_MESSAGE)
  })
})

describe('buildMedicalEventPayload', () => {
  it('sends the pet and the veterinarian as id references and trims the description', () => {
    expect(buildMedicalEventPayload(VALID_EVENT)).toEqual({
      date: '2026-10-01',
      type: 'Cirugia',
      description: 'Esterilización sin complicaciones',
      pet: { id: 1 },
      veterinarian: { id: 5 },
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it('associates the backend messages with their field', () => {
    expect(fieldOfBackendMessage('The pet is not active in the system')).toBe('petId')
    expect(fieldOfBackendMessage('Date cannot be in the future')).toBe('date')
    expect(fieldOfBackendMessage('Veterinarian was not found')).toBe('veterinarianId')
    expect(
      fieldOfBackendMessage(
        'A medical event with the same pet, type and date already exists',
      ),
    ).toBe('type')
  })

  it('returns null for messages that do not belong to a single field', () => {
    expect(fieldOfBackendMessage('Media type not supported')).toBeNull()
  })
})
