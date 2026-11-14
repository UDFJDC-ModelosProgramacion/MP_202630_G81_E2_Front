import { describe, expect, it } from 'vitest'
import {
  EMPTY_FOLLOW_UP,
  PAST_DATE_MESSAGE,
  REQUIRED_MESSAGE,
  buildCreatePayload,
  buildUpdatePayload,
  fieldOfFollowUpMessage,
  validateFollowUp,
  validateObservation,
} from './followUpForm'

describe('validateFollowUp', () => {
  it('requires the date and the observation', () => {
    expect(validateFollowUp(EMPTY_FOLLOW_UP, '2026-11-01')).toEqual({
      date: REQUIRED_MESSAGE,
      observation: REQUIRED_MESSAGE,
    })
  })

  it('rejects a date before today', () => {
    expect(
      validateFollowUp({ date: '2026-10-31', observation: 'Buena adaptación' }, '2026-11-01'),
    ).toEqual({ date: PAST_DATE_MESSAGE })
  })

  it('accepts today and future dates', () => {
    expect(
      validateFollowUp({ date: '2026-11-01', observation: 'Buena adaptación' }, '2026-11-01'),
    ).toEqual({})
    expect(
      validateFollowUp({ date: '2026-11-02', observation: 'Buena adaptación' }, '2026-11-01'),
    ).toEqual({})
  })

  it('treats a blank observation as missing', () => {
    expect(validateFollowUp({ date: '2026-11-02', observation: '   ' }, '2026-11-01')).toEqual({
      observation: REQUIRED_MESSAGE,
    })
  })
})

describe('validateObservation', () => {
  it('only requires the observation on edit', () => {
    expect(validateObservation({ date: '2020-01-01', observation: 'Actualizada' })).toEqual({})
    expect(validateObservation({ date: '2020-01-01', observation: '' })).toEqual({
      observation: REQUIRED_MESSAGE,
    })
  })
})

describe('buildCreatePayload', () => {
  it('sends the date at the end of the day with the veterinarian and adoption ids', () => {
    expect(
      buildCreatePayload(
        { date: '2026-11-05', observation: '  Buena adaptación  ' },
        { adoptionId: '1', veterinarianId: 3 },
      ),
    ).toEqual({
      date: '2026-11-05T23:59:59',
      observation: 'Buena adaptación',
      veterinarian: { id: 3 },
      adoption: { id: 1 },
    })
  })
})

describe('buildUpdatePayload', () => {
  it('sends only the date and observation so the adoption stays intact', () => {
    expect(
      buildUpdatePayload({ date: '2026-11-05T00:00:00.000+00:00', observation: ' Actualizada ' }),
    ).toEqual({ date: '2026-11-05T23:59:59', observation: 'Actualizada' })
  })
})

describe('fieldOfFollowUpMessage', () => {
  it('maps backend messages to their field', () => {
    expect(fieldOfFollowUpMessage('Follow-up date cannot be null')).toBe('date')
    expect(
      fieldOfFollowUpMessage('The scheduled follow-up date cannot be before the current date'),
    ).toBe('date')
    expect(fieldOfFollowUpMessage('Observation cannot be null or empty')).toBe('observation')
  })

  it('returns null for adoption or veterinarian level errors', () => {
    expect(
      fieldOfFollowUpMessage('The associated adoption must be in finalized status'),
    ).toBeNull()
    expect(fieldOfFollowUpMessage('Adoption not found')).toBeNull()
  })
})
