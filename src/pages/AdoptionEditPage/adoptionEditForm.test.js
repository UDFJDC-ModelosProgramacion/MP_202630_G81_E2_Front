import { describe, expect, it } from 'vitest'
import {
  buildAdoptionEditPayload,
  fieldOfBackendMessage,
  REQUIRED_MESSAGE,
  validateAdoptionEdit,
} from './adoptionEditForm'
import { dayStartISO } from '../../utils/dates'

const VALID = { status: 'FINALIZED', date: '2026-11-08', importantNotes: 'Cerrada sin novedades' }

describe('validateAdoptionEdit', () => {
  it('accepts a complete adoption', () => {
    expect(validateAdoptionEdit(VALID)).toEqual({})
  })

  it('asks for every required field, in the order of the form', () => {
    const errors = validateAdoptionEdit({ status: '', date: '', importantNotes: '   ' })

    expect(Object.keys(errors)).toEqual(['status', 'date', 'importantNotes'])
    expect(errors.status).toBe(REQUIRED_MESSAGE)
    expect(errors.date).toBe(REQUIRED_MESSAGE)
    expect(errors.importantNotes).toBe(REQUIRED_MESSAGE)
  })
})

describe('buildAdoptionEditPayload', () => {
  it('sends the status, the date, and the trimmed notes, without the pet or the adopter', () => {
    expect(
      buildAdoptionEditPayload({ ...VALID, importantNotes: '  Cerrada sin novedades  ' }),
    ).toEqual({
      date: dayStartISO('2026-11-08'),
      status: 'FINALIZED',
      importantNotes: 'Cerrada sin novedades',
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it('marks the field that the back-end message refers to', () => {
    expect(fieldOfBackendMessage('A finalized or cancelled adoption cannot be modified')).toBe(
      'status',
    )
    expect(fieldOfBackendMessage('Adoption important notes cannot be null or empty')).toBe(
      'importantNotes',
    )
  })

  it('returns null for a message that is not tied to a field', () => {
    expect(fieldOfBackendMessage('The adoption with the given id was not found')).toBeNull()
  })
})
