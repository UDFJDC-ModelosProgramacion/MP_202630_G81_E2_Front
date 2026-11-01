import { describe, expect, it } from 'vitest'
import { EMPTY_VETERINARIAN, validateVeterinarian } from './validateVeterinarian'

const VALID = {
    firstName: 'Camila',
    lastName: 'Rojas',
    email: 'camila@refugio.com',
    phone: '300 123 4567',
    specialization: 'Cirugía',
    availability: 'Lunes a viernes',
}

describe('validateVeterinarian', () => {
    it('accepts a complete form', () => {
        expect(validateVeterinarian(VALID)).toEqual({})
    })

    it('asks for every required field when the form is empty', () => {
        expect(validateVeterinarian(EMPTY_VETERINARIAN)).toEqual({
            firstName: 'El nombre es obligatorio.',
            lastName: 'El apellido es obligatorio.',
            email: 'El correo es obligatorio.',
            phone: 'El teléfono es obligatorio.',
            specialization: 'Selecciona una especialización.',
            availability: 'Selecciona una disponibilidad.',
        })
    })

    it('treats fields with only spaces as empty', () => {
        const errors = validateVeterinarian({
            ...VALID,
            firstName: '   ',
            lastName: ' ',
            email: '  ',
            phone: '   ',
        })

        expect(Object.keys(errors).sort()).toEqual(['email', 'firstName', 'lastName', 'phone'])
        expect(errors.email).toBe('El correo es obligatorio.')
        expect(errors.phone).toBe('El teléfono es obligatorio.')
    })

    it.each(['camila', 'camila@', 'camila@refugio', '@refugio.com', 'cam ila@refugio.com'])(
        'rejects the e-mail "%s"',
        (email) => {
            expect(validateVeterinarian({ ...VALID, email }).email).toBe('Ingresa un correo válido.')
        },
    )

    it.each(['3001234567', '300 123 4567', '+57 300-123-4567', '(601) 234 5678'])(
        'accepts the phone "%s"',
        (phone) => {
            expect(validateVeterinarian({ ...VALID, phone })).toEqual({})
        },
    )

    it.each(['12345', 'abc1234567', '1234567890123456', '300 123 45x7'])(
        'rejects the phone "%s"',
        (phone) => {
            expect(validateVeterinarian({ ...VALID, phone }).phone).toBe(
                'Ingresa un teléfono válido (entre 7 y 15 dígitos).',
            )
        },
    )

    it('reports only the fields that are wrong', () => {
        expect(validateVeterinarian({ ...VALID, specialization: '' })).toEqual({
            specialization: 'Selecciona una especialización.',
        })
        expect(validateVeterinarian({ ...VALID, availability: '' })).toEqual({
            availability: 'Selecciona una disponibilidad.',
        })
    })
})