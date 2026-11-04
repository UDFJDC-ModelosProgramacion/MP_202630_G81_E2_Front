import { describe, expect, it } from 'vitest'
import {
  buildTrialRequestPayload,
  durationInDays,
  END_BEFORE_START_MESSAGE,
  fieldOfBackendMessage,
  PET_REQUIRED_MESSAGE,
  REQUIRED_MESSAGE,
  START_IN_PAST_MESSAGE,
  validateTrialRequest,
} from './trialCohabitationForm'
import { dayStartISO } from '../../utils/dates'

const TODAY = '2026-11-03'

const VALID = {
  petId: '1',
  startDate: '2026-11-10',
  endDate: '2026-11-20',
  description: 'Quiero convivir con Luna',
}

describe('validateTrialRequest', () => {
  it('accepts a complete period that starts today or later', () => {
    expect(validateTrialRequest(VALID, TODAY)).toEqual({})
    expect(validateTrialRequest({ ...VALID, startDate: TODAY }, TODAY)).toEqual({})
  })

  it('asks for every required field, in the order of the form', () => {
    const errors = validateTrialRequest(
      { petId: '', startDate: '', endDate: '', description: '   ' },
      TODAY,
    )

    expect(Object.keys(errors)).toEqual(['petId', 'startDate', 'endDate', 'description'])
    expect(errors.petId).toBe(PET_REQUIRED_MESSAGE)
    expect(errors.startDate).toBe(REQUIRED_MESSAGE)
    expect(errors.endDate).toBe(REQUIRED_MESSAGE)
    expect(errors.description).toBe(REQUIRED_MESSAGE)
  })

  it('rejects a start date before today', () => {
    const errors = validateTrialRequest({ ...VALID, startDate: '2026-11-02' }, TODAY)

    expect(errors.startDate).toBe(START_IN_PAST_MESSAGE)
  })

  it('rejects an end date before the start date', () => {
    const errors = validateTrialRequest({ ...VALID, endDate: '2026-11-09' }, TODAY)

    expect(errors.endDate).toBe(END_BEFORE_START_MESSAGE)
  })
})

describe('durationInDays', () => {
  it('counts both ends of the period', () => {
    expect(durationInDays('2026-11-10', '2026-11-20')).toBe(11)
    expect(durationInDays('2026-11-10', '2026-11-10')).toBe(1)
  })

  it('counts across a month and a leap day', () => {
    expect(durationInDays('2028-02-28', '2028-03-01')).toBe(3)
  })

  it('has no duration while the period is incomplete or inverted', () => {
    expect(durationInDays('', '2026-11-20')).toBeNull()
    expect(durationInDays('2026-11-10', '')).toBeNull()
    expect(durationInDays('2026-11-20', '2026-11-10')).toBeNull()
  })
})

describe('buildTrialRequestPayload', () => {
  it('sends the request as the back-end expects it, keeping the chosen days', () => {
    const payload = buildTrialRequestPayload(
      { ...VALID, description: '  Quiero convivir con Luna  ' },
      { today: TODAY, adopterId: 7, shelterId: 1 },
    )

    expect(payload).toEqual({
      date: dayStartISO(TODAY),
      status: 'PENDING',
      description: 'Quiero convivir con Luna',
      startDate: dayStartISO('2026-11-10'),
      endDate: dayStartISO('2026-11-20'),
      shelter: { id: 1 },
      adopter: { id: 7 },
      pet: { id: 1 },
    })
  })
})

describe('fieldOfBackendMessage', () => {
  it('marks the field that the back-end message refers to', () => {
    expect(fieldOfBackendMessage('The end date cannot be earlier than the start date')).toBe(
      'endDate',
    )
    expect(fieldOfBackendMessage('The pet is not available for trial cohabitation')).toBe('petId')
    expect(
      fieldOfBackendMessage('The adopter already has an active trial cohabitation request for this pet'),
    ).toBe('petId')
  })

  it('returns null for a message that is not tied to a field', () => {
    expect(fieldOfBackendMessage('The adopter is not active in the system')).toBeNull()
  })
})
