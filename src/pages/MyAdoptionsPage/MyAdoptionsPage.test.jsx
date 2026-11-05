import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyAdoptionsPage from './MyAdoptionsPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getAdoptions } from '../../services/adoptionService'

vi.mock('../../services/adoptionService', () => ({ getAdoptions: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const ADOPTIONS = [
  {
    id: 1,
    date: '2026-09-20',
    status: 'FINALIZED',
    importantNotes: 'Adopción finalizada sin novedades',
    pet: { id: 3, name: 'Kiara', species: 'Gato' },
    shelter: { id: 1, name: 'Refugio Patitas' },
    adopter: { id: 2 },
  },
  {
    id: 2,
    date: '2026-11-04',
    status: 'IN_PROGRESS',
    importantNotes: 'Revisar vacunas cada mes',
    pet: { id: 1, name: 'Luna', species: 'Perro' },
    shelter: { id: 1, name: 'Refugio Patitas' },
    adopter: { id: 2 },
  },
  {
    id: 3,
    date: '2026-10-01',
    status: 'CANCELLED',
    importantNotes: 'Adopción de otro adoptante',
    pet: { id: 4, name: 'Nala', species: 'Gato' },
    shelter: { id: 1, name: 'Refugio Patitas' },
    adopter: { id: 9 },
  },
]

// Applies the filter the way the back-end does for the same request.
function fakeBackend({ adopterId }) {
  return ADOPTIONS.filter((adoption) => String(adoption.adopter.id) === String(adopterId))
}

function renderPage() {
  return render(<MyAdoptionsPage />)
}

describe('MyAdoptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    getAdoptions.mockImplementation(async (filters) => fakeBackend(filters))
  })

  it('lists only the adoptions of the adopter, newest first', async () => {
    renderPage()

    const list = await screen.findByRole('list', { name: 'Mis adopciones' })
    expect(getAdoptions).toHaveBeenCalledWith({ adopterId: 2 })

    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('heading', { name: 'Kiara — Gato' })).toBeInTheDocument()
    expect(screen.queryByText('Nala — Gato')).not.toBeInTheDocument()
  })

  it('shows the status, the shelter, the date, and the important notes', async () => {
    renderPage()
    const list = await screen.findByRole('list', { name: 'Mis adopciones' })

    const [luna, kiara] = within(list).getAllByRole('listitem')
    expect(within(luna).getByText('En curso')).toBeInTheDocument()
    expect(within(luna).getByText('Refugio: Refugio Patitas')).toBeInTheDocument()
    expect(within(luna).getByText('4 nov 2026')).toBeInTheDocument()
    expect(within(luna).getByText('Notas importantes: Revisar vacunas cada mes')).toBeInTheDocument()

    expect(within(kiara).getByText('Finalizada')).toBeInTheDocument()
  })

  it('explains when the adopter has no adoptions', async () => {
    getAdoptions.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Aún no tienes adopciones registradas.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the error and lets the user retry', async () => {
    const user = userEvent.setup()
    getAdoptions.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Mis adopciones' })).toBeInTheDocument(),
    )
    expect(getAdoptions).toHaveBeenCalledTimes(2)
  })

  it('only lets an adopter see the adoptions', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()

    expect(
      screen.getByText('Solo los adoptantes pueden consultar sus adopciones.'),
    ).toBeInTheDocument()
    expect(getAdoptions).not.toHaveBeenCalled()
  })
})
