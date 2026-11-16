import { describe, expect, it } from 'vitest'
import {
    buildUpdatePayload,
    fieldOfBackendMessage,
    fullName,
    initialValues,
    validateUpdate,
    withCurrentOption,
} from './updateVeterinarianForm'

describe('fullName', () => {
    it('joins the first and last name', () => {
        expect(fullName({ firstName: 'Camila', lastName: 'Rojas' })).toBe('Camila Rojas')
    })

    it('skips the parts that are missing', () => {
        expect(fullName({ firstName: 'Camila' })).toBe('Camila')
        expect(fullName({ lastName: 'Rojas' })).toBe('Rojas')
        expect(fullName({})).toBe('')
    })
})

describe('initialValues', () => {
    it('starts from the saved specialization and availability', () => {
        expect(initialValues({ specialization: 'Cirugía', availability: 'Fines de semana' })).toEqual({
            specialization: 'Cirugía',
            availability: 'Fines de semana',
        })
    })

    it('uses empty values when the veterinarian has none (null or missing)', () => {
        expect(initialValues({ specialization: null })).toEqual({ specialization: '', availability: '' })
    })
})

describe('validateUpdate', () => {
    it('accepts a specialization and an availability', () => {
        expect(validateUpdate({ specialization: 'Cirugía', availability: 'Lunes a viernes' })).toEqual({})
    })

    it('requires the specialization', () => {
        expect(validateUpdate({ specialization: '', availability: 'Lunes a viernes' })).toEqual({
            specialization: 'Selecciona una especialización.',
        })
    })

    it('requires the availability', () => {
        expect(validateUpdate({ specialization: 'Cirugía', availability: '' })).toEqual({
            availability: 'Selecciona una disponibilidad.',
        })
    })

    it('rejects values made only of spaces and reports both fields', () => {
        expect(validateUpdate({ specialization: '   ', availability: ' ' })).toEqual({
            specialization: 'Selecciona una especialización.',
            availability: 'Selecciona una disponibilidad.',
        })
    })
})

describe('buildUpdatePayload', () => {
    it('sends only the two editable fields, trimmed', () => {
        expect(
            buildUpdatePayload({
                specialization: ' Cirugía ',
                availability: 'Lunes a viernes ',
                email: 'ignored@x.com',
            }),
        ).toEqual({ specialization: 'Cirugía', availability: 'Lunes a viernes' })
    })
})

describe('withCurrentOption', () => {
    const OPTIONS = ['A', 'B']

    it('keeps the options when the current value is one of them', () => {
        expect(withCurrentOption(OPTIONS, 'B')).toBe(OPTIONS)
    })

    it('adds a current value that is not a standard option at the top', () => {
        expect(withCurrentOption(OPTIONS, 'Otra')).toEqual(['Otra', 'A', 'B'])
    })

    it('keeps the options when there is no current value', () => {
        expect(withCurrentOption(OPTIONS, '')).toBe(OPTIONS)
        expect(withCurrentOption(OPTIONS, null)).toBe(OPTIONS)
    })
})

describe('fieldOfBackendMessage', () => {
    it('maps the backend messages to the field they refer to', () => {
        expect(fieldOfBackendMessage('Specialization cannot be null or empty')).toBe('specialization')
        expect(fieldOfBackendMessage('Availability cannot be null or empty')).toBe('availability')
    })

    it('returns null for any other message', () => {
        expect(fieldOfBackendMessage('Veterinarian not found')).toBeNull()
        expect(fieldOfBackendMessage(undefined)).toBeNull()
    })
})