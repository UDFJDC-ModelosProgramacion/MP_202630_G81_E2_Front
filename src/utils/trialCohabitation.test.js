import { describe, expect, it } from 'vitest'
import {
  buildDecisionPayload,
  canCancelTrialRequest,
  canDecideTrialRequest,
  canViewTrialRequest,
  isPendingRequest,
  trialRequestStatusLabel,
} from './trialCohabitation'

describe('trialRequestStatusLabel', () => {
  it('shows each status in Spanish', () => {
    expect(trialRequestStatusLabel('PENDING')).toBe('Pendiente')
    expect(trialRequestStatusLabel('APPROVED')).toBe('Aprobada')
    expect(trialRequestStatusLabel('REJECTED')).toBe('Rechazada')
    expect(trialRequestStatusLabel('CANCELLED')).toBe('Cancelada')
  })

  it('keeps an unknown status and names a missing one', () => {
    expect(trialRequestStatusLabel('ON_HOLD')).toBe('ON_HOLD')
    expect(trialRequestStatusLabel(null)).toBe('Sin estado')
  })
})

describe('canViewTrialRequest', () => {
  const REQUEST = { adopter: { id: 2 }, pet: { id: 1, shelter: { id: 1 } } }

  it('lets the adopter see only the requests they sent', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'ADOPTER', userId: 2 })).toBe(true)
    expect(canViewTrialRequest(REQUEST, { role: 'ADOPTER', userId: 3 })).toBe(false)
  })

  it('lets the shelter see only the requests for its pets', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(true)
    expect(canViewTrialRequest(REQUEST, { role: 'SHELTER_ADMIN', shelterId: 2 })).toBe(false)
  })

  it('keeps the other roles out', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'VETERINARIAN', userId: 2, shelterId: 1 })).toBe(false)
  })
})

describe('isPendingRequest', () => {
  it('is true only while the request is pending', () => {
    expect(isPendingRequest({ status: 'PENDING' })).toBe(true)
    expect(isPendingRequest({ status: 'APPROVED' })).toBe(false)
    expect(isPendingRequest({ status: 'REJECTED' })).toBe(false)
    expect(isPendingRequest({ status: 'CANCELLED' })).toBe(false)
  })
})

describe('canDecideTrialRequest', () => {
  const PENDING = { status: 'PENDING', pet: { shelter: { id: 1 } } }

  it('lets the shelter that owns the pet decide on a pending request', () => {
    expect(canDecideTrialRequest(PENDING, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(true)
  })

  it('keeps the adopter, another shelter, and finalized requests out', () => {
    expect(canDecideTrialRequest(PENDING, { role: 'ADOPTER', userId: 2 })).toBe(false)
    expect(canDecideTrialRequest(PENDING, { role: 'SHELTER_ADMIN', shelterId: 2 })).toBe(false)
    expect(
      canDecideTrialRequest({ ...PENDING, status: 'APPROVED' }, { role: 'SHELTER_ADMIN', shelterId: 1 }),
    ).toBe(false)
  })
})

describe('canCancelTrialRequest', () => {
  const PENDING = { status: 'PENDING', adopter: { id: 2 } }

  it('lets the adopter who sent a pending request cancel it', () => {
    expect(canCancelTrialRequest(PENDING, { role: 'ADOPTER', userId: 2 })).toBe(true)
  })

  it('keeps other adopters, the shelter, and finalized requests out', () => {
    expect(canCancelTrialRequest(PENDING, { role: 'ADOPTER', userId: 3 })).toBe(false)
    expect(canCancelTrialRequest(PENDING, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(false)
    expect(
      canCancelTrialRequest({ ...PENDING, status: 'REJECTED' }, { role: 'ADOPTER', userId: 2 }),
    ).toBe(false)
  })
})

describe('buildDecisionPayload', () => {
  it('sends the new status with the description the back-end requires', () => {
    expect(
      buildDecisionPayload({ description: 'Quiero convivir con Luna', status: 'PENDING' }, 'APPROVED'),
    ).toEqual({ status: 'APPROVED', description: 'Quiero convivir con Luna' })
  })
})
