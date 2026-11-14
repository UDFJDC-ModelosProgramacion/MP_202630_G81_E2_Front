import { describe, expect, it } from 'vitest'
import {
  buildAdoptionPayload,
  fieldOfBackendMessage,
  REQUEST_REQUIRED_MESSAGE,
  REQUIRED_MESSAGE,
  validateAdoption,
} from './adoptionForm'
import { dayStartISO } from '../../utils/dates'

const VALID = { requestId: '11', date: '2026-11-04', importantNotes: 'Revisar vacunas cada mes' }

const REQUEST = {
  id: 11,
  status: 'APPROVED',
  pet: { id: 1, name: 'Luna', shelter: { id: 1 } },
  adopter: { id: 2, firstName: 'Carlos', lastName: 'Perez' },
}

describe('validateAdoption', () => {
  it('accepts a complete adoption', () => {
    expect(validateAdoption(VALID)).toEqual({})
  })

  it('asks for every required field, in the order of the form', () => {
    const errors = validateAdoption({ requestId: '', date: '', importantNotes: '   ' })

    expect(Object.keys(errors)).toEqual(['requestId', 'date', 'importantNotes'])
    expect(errors.requestId).toBe(REQUEST_REQUIRED_MESSAGE)
    expect(errors.date).toBe(REQUIRED_MESSAGE)
    expect(errors.importantNotes).toBe(REQUIRED_MESSAGE)
  })
})

describe('buildAdoptionPayload', () => {
  it('takes the pet, the shelter, and the adopter from the approved request', () => {
    const payload = buildAdoptionPayload(
      { ...VALID, importantNotes: '  Revisar vacunas cada mes  ' },
      REQUEST,
    )

    expect(payload).toEqual({
      date: dayStartISO('2026-11-04'),
      status: 'IN_PROGRESS',
      importantNotes: 'Revisar vacunas cada mes',
      pet: { id: 1 },
      shelter: { id: 1 },
      adopter: { id: 2 },
      adoptionRequest: { id: 11 },
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it('marks the field that the back-end message refers to', () => {
    expect(fieldOfBackendMessage('An adoption already exists for this pet')).toBe('requestId')
    expect(fieldOfBackendMessage('Adoption important notes cannot be null or empty')).toBe(
      'importantNotes',
    )
    expect(fieldOfBackendMessage('Adoption date cannot be null or empty')).toBe('date')
  })

  it('returns null for a message that is not tied to a field', () => {
    expect(fieldOfBackendMessage('Adoption is not valid')).toBeNull()
  })
})
