import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUser } from '../../services/userService'
import UserRegisterPage from './UserRegisterPage'

vi.mock('../../services/userService', () => ({
  createUser: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <UserRegisterPage />
    </MemoryRouter>,
  )
}

describe('UserRegisterPage (HU73)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all registration fields marked as required', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Crear Cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeRequired()
    expect(screen.getByLabelText(/apellido/i)).toBeRequired()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeRequired()
    expect(screen.getByLabelText(/^contraseña/i)).toBeRequired()
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeRequired()
  })

  it('validates required fields on client submission without calling backend', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(createUser).not.toHaveBeenCalled()
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(screen.getByText('Debe confirmar su contraseña')).toBeInTheDocument()
  })

  it('validates password minimum length and matching confirmation', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/nombre/i), 'Anggel')
    await user.type(screen.getByLabelText(/apellido/i), 'Leal')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'anggel@test.com')
    await user.type(screen.getByLabelText(/^contraseña/i), '1234')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'abcd')

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(createUser).not.toHaveBeenCalled()
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('successfully creates account and shows success dialog', async () => {
    const user = userEvent.setup()
    createUser.mockResolvedValueOnce({
      id: 15,
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@example.com',
    })

    renderPage()

    await user.type(screen.getByLabelText(/nombre/i), 'Anggel')
    await user.type(screen.getByLabelText(/apellido/i), 'Leal')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'anggel@example.com')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/^contraseña/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123')

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        firstName: 'Anggel',
        lastName: 'Leal',
        email: 'anggel@example.com',
        phone: '3001234567',
        password: 'password123',
      })
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('¡Cuenta creada exitosamente!')).toBeInTheDocument()
  })

  it('handles duplicate email backend error and displays error dialog', async () => {
    const user = userEvent.setup()
    createUser.mockRejectedValueOnce(
      new Error('The email address must be unique in the system'),
    )

    renderPage()

    await user.type(screen.getByLabelText(/nombre/i), 'Anggel')
    await user.type(screen.getByLabelText(/apellido/i), 'Leal')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^contraseña/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123')

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText('No se pudo crear la cuenta')).toBeInTheDocument()
      expect(screen.getAllByText('The email address must be unique in the system')).toHaveLength(2)
    })
  })
})
