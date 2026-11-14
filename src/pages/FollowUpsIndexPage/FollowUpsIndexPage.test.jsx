import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FollowUpsIndexPage from './FollowUpsIndexPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { getVeterinarian } from '../../services/veterinarianService'

vi.mock('../../services/veterinarianService', () => ({ getVeterinarian: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: {
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    VETERINARIAN: 'VETERINARIAN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
  getSession: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/followUps']}>
      <Routes>
        <Route path="/followUps" element={<FollowUpsIndexPage />} />
        <Route path="/adoptions/:adoptionId/followUps" element={<p>Lista de seguimientos</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const FUTURE = '2030-01-15T00:00:00.000+00:00'
const PAST = '2020-01-01T00:00:00.000+00:00'

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'VETERINARIAN', userId: 1 })
  vi.mocked(getVeterinarian).mockReset()
})

describe('FollowUpsIndexPage', () => {
  it('lists the follow-ups of the veterinarian with their adoption', async () => {
    vi.mocked(getVeterinarian).mockResolvedValue({
      id: 1,
      firstName: 'Laura',
      followUps: [
        { id: 1, date: PAST, observation: 'Seguimiento cerrado', adoption: { id: 1 } },
        { id: 2, date: FUTURE, observation: 'Seguimiento de control', adoption: { id: 2 } },
      ],
    })
    renderPage()

    expect(await screen.findByText('Seguimiento del 15 ene 2030')).toBeInTheDocument()
    expect(screen.getByText('Seguimiento del 1 ene 2020')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '#2' })).toHaveAttribute(
      'href',
      '/adoptions/2/followUps',
    )
    expect(getVeterinarian).toHaveBeenCalledWith(1)
  })

  it('shows the empty state when the veterinarian has no follow-ups', async () => {
    vi.mocked(getVeterinarian).mockResolvedValue({ id: 1, followUps: [] })
    renderPage()

    expect(await screen.findByText('Aún no tiene seguimientos asignados.')).toBeInTheDocument()
  })

  it('shows the backend message on error', async () => {
    vi.mocked(getVeterinarian).mockRejectedValue(new ApiError('Veterinarian not found', 404))
    renderPage()

    expect(await screen.findByText('Veterinarian not found')).toBeInTheDocument()
  })

  it('blocks roles other than the veterinarian', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 2 })
    renderPage()

    expect(
      screen.getByText('Solo el veterinario tiene un índice de seguimientos propios.'),
    ).toBeInTheDocument()
    expect(getVeterinarian).not.toHaveBeenCalled()
  })
})
