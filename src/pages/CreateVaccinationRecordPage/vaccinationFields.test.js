import { describe, expect, it } from 'vitest'
import {
    fieldOfBackendMessage,
    PET_REQUIRED,
    petOptions,
    petsWithoutRecord,
    preselectedPet,
    validatePet,
} from './vaccinationFields'

describe('validatePet', () => {
    it('requires a pet', () => {
        expect(validatePet('')).toBe(PET_REQUIRED)
        expect(validatePet('3')).toBe('')
    })
})

describe('petsWithoutRecord', () => {
    it('keeps only the pets that have no vaccination record', () => {
        const pets = [{ id: 1, vaccinationRecord: { id: 8 } }, { id: 2 }, { id: 3, vaccinationRecord: null }]

        expect(petsWithoutRecord(pets).map((pet) => pet.id)).toEqual([2, 3])
    })
})

describe('petOptions', () => {
    it('uses the name of each pet', () => {
        expect(petOptions([{ id: 1, name: 'Max' }, { id: 2, name: 'Luna' }])).toEqual([
            { value: '1', label: 'Max' },
            { value: '2', label: 'Luna' },
        ])
    })

    it('adds the number to pets that share a name', () => {
        expect(petOptions([{ id: 1, name: 'Max' }, { id: 2, name: 'Max' }, { id: 3, name: 'Luna' }])).toEqual([
            { value: '1', label: 'Max (N.º 1)' },
            { value: '2', label: 'Max (N.º 2)' },
            { value: '3', label: 'Luna' },
        ])
    })

    it('names a pet without name by its number', () => {
        expect(petOptions([{ id: 7 }])).toEqual([{ value: '7', label: 'Mascota 7' }])
    })
})

describe('preselectedPet', () => {
    const options = [{ value: '3', label: 'Max' }]

    it('preselects a pet that is one of the options', () => {
        expect(preselectedPet('3', options)).toBe('3')
        expect(preselectedPet(3, options)).toBe('3')
    })

    it('ignores a pet that is not an option or a missing value', () => {
        expect(preselectedPet('9', options)).toBe('')
        expect(preselectedPet(null, options)).toBe('')
    })
})

describe('fieldOfBackendMessage', () => {
    it('maps the back-end messages about the pet to its field', () => {
        expect(fieldOfBackendMessage('Pet not found')).toBe('petId')
        expect(fieldOfBackendMessage('This pet already has a vaccination record')).toBe('petId')
        expect(
            fieldOfBackendMessage('Vaccination record must be associated with an existing pet'),
        ).toBe('petId')
    })

    it('returns null for any other message', () => {
        expect(fieldOfBackendMessage('Anything else')).toBeNull()
    })
})