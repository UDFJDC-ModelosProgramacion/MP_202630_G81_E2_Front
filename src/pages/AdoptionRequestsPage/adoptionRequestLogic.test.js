import { describe, expect, it } from 'vitest'
import {
  filterAdoptionRequests,
  validateAdoptionRequest,
} from './adoptionRequestLogic'

describe('adoptionRequestLogic', () => {
  it('validates pet selection and justification length', () => {
    expect(validateAdoptionRequest('', null)).toEqual({
      petId: 'Debe seleccionar una mascota',
      justification: 'La justificación es obligatoria',
    })
    expect(validateAdoptionRequest('corta', 1)).toEqual({
      justification: 'La justificación debe tener al menos 10 caracteres',
    })
    expect(validateAdoptionRequest('Tenemos casa amplia con patio', 1)).toEqual({})
  })

  it('filters adoption requests by pet name and status', () => {
    const list = [
      { id: 1, pet: { name: 'Firulais' }, status: 'PENDING' },
      { id: 2, pet: { name: 'Michi' }, status: 'APPROVED' },
    ]

    expect(filterAdoptionRequests(list, { petName: 'Firu' })).toHaveLength(1)
    expect(filterAdoptionRequests(list, { status: 'APPROVED' })).toHaveLength(1)
    expect(filterAdoptionRequests(list, { petName: 'Michi', status: 'PENDING' })).toHaveLength(0)
  })
})
