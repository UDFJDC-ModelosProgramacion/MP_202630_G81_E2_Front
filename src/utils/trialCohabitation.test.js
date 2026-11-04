import { describe, expect, it } from 'vitest'
import { trialRequestStatusLabel } from './trialCohabitation'

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
