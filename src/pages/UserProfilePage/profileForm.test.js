import { describe, expect, it } from 'vitest'
import { toUserUpdatePayload, validateUserProfileForm } from './profileForm'

describe('profileForm', () => {
  it('detects missing required fields', () => {
    const errors = validateUserProfileForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    })
    expect(errors.firstName).toBe('El nombre es obligatorio')
    expect(errors.lastName).toBe('El apellido es obligatorio')
    expect(errors.email).toBe('El correo electrónico es obligatorio')
  })

  it('rejects invalid email formats', () => {
    const errors = validateUserProfileForm({
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'not-an-email',
      phone: '3001234567',
    })
    expect(errors.email).toBe('Ingrese un correo electrónico válido')
  })

  it('creates clean payload when valid', () => {
    const values = {
      firstName: '  Anggel  ',
      lastName: '  Leal  ',
      email: '  anggel@test.com  ',
      phone: '  3001234567  ',
    }
    const errors = validateUserProfileForm(values)
    expect(Object.keys(errors).length).toBe(0)

    const payload = toUserUpdatePayload(values)
    expect(payload).toEqual({
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@test.com',
      phone: '3001234567',
    })
  })
})
