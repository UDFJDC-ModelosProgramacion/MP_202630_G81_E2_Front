import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteAdoptionRequest,
  getAllAdoptionRequests,
  updateAdoptionRequest,
} from '../../services/adoptionRequestService'
import { getPets } from '../../services/petService'
import AdoptionRequestsPage from './AdoptionRequestsPage'

vi.mock('../../services/adoptionRequestService', () => ({
  getAllAdoptionRequests: vi.fn(),
  createAdoptionRequest: vi.fn(),
  updateAdoptionRequest: vi.fn(),
  deleteAdoptionRequest: vi.fn(),
}))

vi.mock('../../services/petService', () => ({
  getPets: vi.fn(),
}))

const mockAuth = {
  session: {
    userId: 1,
    role: 'ADOPTER',
  },
}

vi.mock('../../auth/useAuth', () => ({
  default: () => mockAuth,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AdoptionRequestsPage />
    </MemoryRouter>,
  )
}

describe('AdoptionRequestsPage (HU81 to HU84)', () => {
  const mockRequests = [
    {
      id: 1,
      pet: { id: 10, name: 'Firulais', species: 'Perro' },
      adopter: { id: 1, firstName: 'Anggel' },
      justification: 'Casa amplia y tiempo para cuidar',
      status: 'PENDING',
    },
  ]

  const mockPets = [{ id: 10, name: 'Firulais', species: 'Perro' }]

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.session = { userId: 1, role: 'ADOPTER' }
    getAllAdoptionRequests.mockResolvedValue(mockRequests)
    getPets.mockResolvedValue(mockPets)
  })

  it('renders adoption requests list (HU82)', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
      expect(screen.getByText('Casa amplia y tiempo para cuidar')).toBeInTheDocument()
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })
  })

  it('allows adopter to cancel pending request (HU84)', async () => {
    const user = userEvent.setup()
    deleteAdoptionRequest.mockResolvedValueOnce(null)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('¿Cancelar solicitud de adopción?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar Solicitud' }))

    await waitFor(() => {
      expect(deleteAdoptionRequest).toHaveBeenCalledWith(1)
    })
  })

  it('allows admin to approve pending request (HU83)', async () => {
    mockAuth.session = { userId: 2, role: 'SHELTER_ADMIN' }
    updateAdoptionRequest.mockResolvedValueOnce({
      ...mockRequests[0],
      status: 'APPROVED',
    })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Aprobar' }))

    await waitFor(() => {
      expect(updateAdoptionRequest).toHaveBeenCalledWith(1, { status: 'APPROVED' })
    })
  })
})
