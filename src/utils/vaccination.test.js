import { describe, expect, it } from 'vitest'
import { isApplied, sortVaccines, vaccineStatusLabel } from './vaccination'

describe('status', () => {
    it('only a vaccine with status true is applied', () => {
        expect(isApplied({ status: true })).toBe(true)
        expect(isApplied({ status: false })).toBe(false)
        expect(isApplied({})).toBe(false)
        expect(vaccineStatusLabel({ status: true })).toBe('Aplicada')
        expect(vaccineStatusLabel({ status: null })).toBe('Pendiente')
    })
})

describe('sortVaccines', () => {
    const rabies = { id: 1, status: true, administrationDate: '2026-01-10' }
    const distemper = { id: 2, status: true, administrationDate: '2026-03-15' }
    const hepatitis = { id: 3, status: false, nextAdministration: '2026-11-20' }
    const leptospirosis = { id: 4, status: false, nextAdministration: '2026-05-01' }

    it('shows the applied ones first by date and then the pending ones by next dose', () => {
        expect(sortVaccines([hepatitis, distemper, leptospirosis, rabies]).map((v) => v.id)).toEqual([
            1, 2, 4, 3,
        ])
    })

    it('does not change the received list and tolerates missing dates', () => {
        const original = [hepatitis, { id: 9, status: true }]

        expect(sortVaccines(original).map((v) => v.id)).toEqual([9, 3])
        expect(original.map((v) => v.id)).toEqual([3, 9])
    })
})