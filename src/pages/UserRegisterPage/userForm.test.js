import { describe, expect, it } from 'vitest'
import {
  EMPTY_USER_FORM,
  matchUserBackendError,
  toUserPayload,
  validateUserForm,
} from './userForm'

describe('userForm', () => {
  it('detects missing required fields', () => {
    const errors = validateUserForm(EMPTY_USER_FORM)
    expect(errors.firstName).toBe('El nombre es obligatorio')
    expect(errors.lastName).toBe('El apellido es obligatorio')
    expect(errors.email).toBe('El correo electrónico es obligatorio')
    expect(errors.password).toBe('La contraseña es obligatoria')
    expect(errors.confirmPassword).toBe('Debe confirmar su contraseña')
  })

  it('rejects invalid email formats', () => {
    const values = {
      ...EMPTY_USER_FORM,
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    }
    const errors = validateUserForm(values)
    expect(errors.email).toBe('Ingrese un correo electrónico válido')
  })

  it('rejects passwords shorter than 8 characters', () => {
    const values = {
      ...EMPTY_USER_FORM,
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@test.com',
      password: 'short',
      confirmPassword: 'short',
    }
    const errors = validateUserForm(values)
    expect(errors.password).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('rejects mismatched password confirmation', () => {
    const values = {
      ...EMPTY_USER_FORM,
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@test.com',
      password: 'password123',
      confirmPassword: 'differentPassword',
    }
    const errors = validateUserForm(values)
    expect(errors.confirmPassword).toBe('Las contraseñas no coinciden')
  })

  it('passes validation with clean inputs and creates payload', () => {
    const values = {
      firstName: '  Anggel ',
      lastName: ' Leal  ',
      email: ' anggel@example.com ',
      phone: '  3001234567 ',
      password: 'password123',
      confirmPassword: 'password123',
    }
    const errors = validateUserForm(values)
    expect(Object.keys(errors).length).toBe(0)

    const payload = toUserPayload(values)
    expect(payload).toEqual({
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@example.com',
      phone: '3001234567',
      password: 'password123',
    })
  })

  it('matches backend errors to proper fields', () => {
    expect(matchUserBackendError('The email address must be unique in the system')).toEqual({
      field: 'email',
      text: 'The email address must be unique in the system',
    })
    expect(matchUserBackendError('La contraseña debe tener al menos 8 caracteres')).toEqual({
      field: 'password',
      text: 'La contraseña debe tener al menos 8 caracteres',
    })
    expect(matchUserBackendError('Required attributes cannot be null or empty')).toEqual({
      field: null,
      text: 'Required attributes cannot be null or empty',
    })
  })
})
