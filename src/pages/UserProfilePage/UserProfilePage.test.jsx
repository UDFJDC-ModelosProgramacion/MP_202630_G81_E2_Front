import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getUser, updateUser } from '../../services/userService'
import UserProfilePage from './UserProfilePage'

vi.mock('../../services/userService', () => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('../../config/session', () => ({
  getSession: () => ({
    userId: 1,
    name: 'Anggel Leal',
    role: 'ADOPTER',
  }),
  ROLES: {
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    VETERINARIAN: 'VETERINARIAN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <UserProfilePage />
    </MemoryRouter>,
  )
}

describe('UserProfilePage (HU74)', () => {
  const mockUser = {
    id: 1,
    firstName: 'Anggel',
    lastName: 'Leal',
    email: 'anggel@example.com',
    phone: '3001234567',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays user profile information', async () => {
    getUser.mockResolvedValueOnce(mockUser)
    renderPage()

    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Anggel Leal' })).toBeInTheDocument()
    })

    expect(screen.getByText('anggel@example.com')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument()
  })

  it('switches to edit mode and cancels unsaved modifications', async () => {
    const user = userEvent.setup()
    getUser.mockResolvedValueOnce(mockUser)
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Editar Perfil' }))

    const nameInput = screen.getByLabelText(/^nombre/i)
    expect(nameInput).toHaveValue('Anggel')

    await user.clear(nameInput)
    await user.type(nameInput, 'Modificado')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText(/^nombre/i)).not.toBeInTheDocument()
    expect(screen.getByText('Anggel')).toBeInTheDocument()
  })

  it('validates fields and saves updated profile information', async () => {
    const user = userEvent.setup()
    getUser.mockResolvedValueOnce(mockUser)
    updateUser.mockResolvedValueOnce({
      ...mockUser,
      firstName: 'Anggel Felipe',
      phone: '3109998877',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Editar Perfil' }))

    const nameInput = screen.getByLabelText(/^nombre/i)
    const phoneInput = screen.getByLabelText(/teléfono/i)

    await user.clear(nameInput)
    await user.type(nameInput, 'Anggel Felipe')

    await user.clear(phoneInput)
    await user.type(phoneInput, '3109998877')

    await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }))

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: 'Anggel Felipe',
        lastName: 'Leal',
        email: 'anggel@example.com',
        phone: '3109998877',
      })
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('¡Perfil actualizado!')).toBeInTheDocument()
  })

  it('displays backend error dialog when update fails', async () => {
    const user = userEvent.setup()
    getUser.mockResolvedValueOnce(mockUser)
    updateUser.mockRejectedValueOnce(
      new Error('The email address cannot be updated to one that already belongs to another user'),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Editar Perfil' }))

    await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }))

    await waitFor(() => {
      expect(screen.getByText('No se pudo actualizar el perfil')).toBeInTheDocument()
      expect(
        screen.getAllByText(
          'The email address cannot be updated to one that already belongs to another user',
        ),
      ).toHaveLength(2)
    })
  })
})
