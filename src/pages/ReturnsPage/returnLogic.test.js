import { describe, expect, it } from 'vitest'
import { filterReturns, validateReturnReason } from './returnLogic'

describe('returnLogic', () => {
  it('validates return reason length and pet selection', () => {
    expect(validateReturnReason('', null)).toEqual({
      petId: 'Debe seleccionar una mascota para la devolución',
      reason: 'El motivo de la devolución es obligatorio',
    })
    expect(validateReturnReason('corta', 1)).toEqual({
      reason: 'El motivo debe tener al menos 10 caracteres',
    })
    expect(validateReturnReason('Problemas de compatibilidad con otra mascota', 1)).toEqual({})
  })

  it('filters returns by pet name and adopter name', () => {
    const list = [
      { id: 1, pet: { name: 'Firulais' }, adopter: { firstName: 'Anggel' } },
      { id: 2, pet: { name: 'Michi' }, adopter: { firstName: 'Luna' } },
    ]

    expect(filterReturns(list, { petName: 'Firu' })).toHaveLength(1)
    expect(filterReturns(list, { adopterName: 'Luna' })).toHaveLength(1)
    expect(filterReturns(list, { petName: 'Michi', adopterName: 'Anggel' })).toHaveLength(0)
  })
})
