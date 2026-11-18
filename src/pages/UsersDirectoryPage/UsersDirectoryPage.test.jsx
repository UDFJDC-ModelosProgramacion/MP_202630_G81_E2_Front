import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteUser, getAllUsers } from '../../services/userService'
import UsersDirectoryPage from './UsersDirectoryPage'

vi.mock('../../services/userService', () => ({
  getAllUsers: vi.fn(),
  deleteUser: vi.fn(),
}))

const mockAuth = {
  session: {
    userId: 1,
    role: 'SHELTER_ADMIN',
  },
}

vi.mock('../../auth/useAuth', () => ({
  default: () => mockAuth,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersDirectoryPage />
    </MemoryRouter>,
  )
}

describe('UsersDirectoryPage (HU75 & HU76)', () => {
  const mockUsers = [
    { id: 1, firstName: 'Anggel', lastName: 'Leal', email: 'anggel@test.com', phone: '3001234567', role: 'ADOPTER' },
    { id: 2, firstName: 'Luna', lastName: 'Sandoval', email: 'luna@test.com', phone: '3109876543', role: 'SHELTER_ADMIN' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.session = { userId: 1, role: 'SHELTER_ADMIN' }
  })

  it('renders users table when user is admin', async () => {
    getAllUsers.mockResolvedValueOnce(mockUsers)
    renderPage()

    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Anggel Leal')).toBeInTheDocument()
      expect(screen.getByText('Luna Sandoval')).toBeInTheDocument()
    })
  })

  it('denies access if user is not admin', async () => {
    mockAuth.session = { userId: 2, role: 'ADOPTER' }
    renderPage()

    expect(
      screen.getByText('Acceso denegado. Esta sección es exclusiva para administradores.'),
    ).toBeInTheDocument()
    expect(getAllUsers).not.toHaveBeenCalled()
  })

  it('filters users by search term', async () => {
    const user = userEvent.setup()
    getAllUsers.mockResolvedValueOnce(mockUsers)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Anggel Leal')).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText('Buscar usuarios')
    await user.type(searchInput, 'Luna')

    expect(screen.queryByText('Anggel Leal')).not.toBeInTheDocument()
    expect(screen.getByText('Luna Sandoval')).toBeInTheDocument()
  })

  it('opens confirmation modal and deletes user on confirm (HU76)', async () => {
    const user = userEvent.setup()
    getAllUsers.mockResolvedValueOnce(mockUsers)
    deleteUser.mockResolvedValueOnce(null)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Anggel Leal')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button', { name: 'Eliminar' })
    await user.click(deleteBtns[0])

    expect(screen.getByText('¿Eliminar cuenta de usuario?')).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar cuenta' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith(1)
      expect(screen.getByText('Usuario eliminado correctamente.')).toBeInTheDocument()
    })
  })

  it('shows error dialog when deletion is prevented due to active dependencies', async () => {
    const user = userEvent.setup()
    getAllUsers.mockResolvedValueOnce(mockUsers)
    deleteUser.mockRejectedValueOnce(
      new Error('A user with active adoption processes cannot be deleted'),
    )
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Anggel Leal')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button', { name: 'Eliminar' })
    await user.click(deleteBtns[0])

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar cuenta' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Error al eliminar cuenta')).toBeInTheDocument()
      expect(
        screen.getByText('A user with active adoption processes cannot be deleted'),
      ).toBeInTheDocument()
    })
  })
})
