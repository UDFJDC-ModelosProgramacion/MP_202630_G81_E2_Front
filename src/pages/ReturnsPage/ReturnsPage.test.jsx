import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPets } from '../../services/petService'
import {
  createReturn,
  getAllReturns,
  updateReturn,
} from '../../services/returnService'
import ReturnsPage from './ReturnsPage'

vi.mock('../../services/returnService', () => ({
  getAllReturns: vi.fn(),
  createReturn: vi.fn(),
  updateReturn: vi.fn(),
}))

vi.mock('../../services/petService', () => ({
  getPets: vi.fn(),
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
      <ReturnsPage />
    </MemoryRouter>,
  )
}

describe('ReturnsPage (HU85 to HU88)', () => {
  const mockReturns = [
    {
      id: 1,
      pet: { id: 10, name: 'Firulais' },
      adopter: { id: 1, firstName: 'Anggel' },
      reason: 'Alergia severa en la familia',
      returnDate: '2026-11-12T00:00:00Z',
    },
  ]

  const mockPets = [{ id: 10, name: 'Firulais', species: 'Perro' }]

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.session = { userId: 1, role: 'SHELTER_ADMIN' }
    getAllReturns.mockResolvedValue(mockReturns)
    getPets.mockResolvedValue(mockPets)
  })

  it('renders returns table (HU86)', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
      expect(screen.getByText('Alergia severa en la familia')).toBeInTheDocument()
      expect(screen.getByText('Anggel')).toBeInTheDocument()
    })
  })

  it('allows registering a return (HU85)', async () => {
    const user = userEvent.setup()
    createReturn.mockResolvedValueOnce({
      id: 2,
      pet: { id: 10, name: 'Firulais' },
      adopter: { id: 1 },
      reason: 'Falta de espacio adecuado',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Registrar Devolución' }))
    expect(screen.getByText('Registrar Devolución de Mascota')).toBeInTheDocument()

    const select = screen.getByLabelText('Mascota a devolver:')
    await user.selectOptions(select, '10')

    const textarea = screen.getByLabelText('Motivo detallado:')
    await user.type(textarea, 'Falta de espacio adecuado')

    await user.click(screen.getByRole('button', { name: 'Guardar Devolución' }))

    await waitFor(() => {
      expect(createReturn).toHaveBeenCalled()
      expect(screen.getByText('Devolución registrada exitosamente.')).toBeInTheDocument()
    })
  })

  it('allows updating return reason (HU88)', async () => {
    const user = userEvent.setup()
    updateReturn.mockResolvedValueOnce({
      ...mockReturns[0],
      reason: 'Motivo modificado formalmente',
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Modificar Motivo' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Modificar Motivo' }))

    const textarea = screen.getByLabelText('Motivo actualizado:')
    await user.clear(textarea)
    await user.type(textarea, 'Motivo modificado formalmente')

    await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }))

    await waitFor(() => {
      expect(updateReturn).toHaveBeenCalledWith(1, expect.objectContaining({
        reason: 'Motivo modificado formalmente',
      }))
    })
  })
})
