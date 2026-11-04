import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrialCohabitationListPage from './TrialCohabitationListPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getTrialCohabitationRequests } from '../../services/trialCohabitationService'

vi.mock('../../services/trialCohabitationService', () => ({
  getTrialCohabitationRequests: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const REQUESTS = [
  {
    id: 1,
    status: 'PENDING',
    date: '2026-10-20',
    description: 'Quiero convivir con Kiara',
    startDate: '2026-10-25',
    endDate: '2026-10-27',
    shelter: { id: 1, name: 'Refugio Patitas' },
    pet: { id: 2, name: 'Kiara', species: 'Perro' },
  },
  {
    id: 2,
    status: 'APPROVED',
    date: '2026-11-03',
    description: 'Quiero convivir con Luna',
    startDate: '2026-11-10T05:00:00.000+00:00',
    endDate: '2026-11-20T05:00:00.000+00:00',
    shelter: { id: 1, name: 'Refugio Patitas' },
    pet: { id: 1, name: 'Luna', species: 'Perro' },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trial-cohabitation-requests']}>
      <Routes>
        <Route path="/trial-cohabitation-requests" element={<TrialCohabitationListPage />} />
        <Route path="/trial-cohabitation-requests/new" element={<p>Nueva solicitud</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TrialCohabitationListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    getTrialCohabitationRequests.mockResolvedValue(REQUESTS)
  })

  it('lists only the requests of the adopter, newest request first', async () => {
    renderPage()

    expect(await screen.findByRole('list', { name: 'Mis solicitudes de convivencia' })).toBeInTheDocument()
    expect(getTrialCohabitationRequests).toHaveBeenCalledWith({ adopterId: 2 })

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('heading', { name: 'Kiara — Perro' })).toBeInTheDocument()
  })

  it('shows the status, the period and its duration of each request', async () => {
    renderPage()
    await screen.findByRole('list', { name: 'Mis solicitudes de convivencia' })

    const [luna, kiara] = screen.getAllByRole('listitem')
    expect(within(luna).getByText('Aprobada')).toBeInTheDocument()
    expect(within(luna).getByText('10 nov 2026')).toBeInTheDocument()
    expect(within(luna).getByText('20 nov 2026')).toBeInTheDocument()
    expect(within(luna).getByText('(11 días)')).toBeInTheDocument()

    expect(within(kiara).getByText('Pendiente')).toBeInTheDocument()
    expect(within(kiara).getByText('(3 días)')).toBeInTheDocument()
    expect(within(kiara).getByText('Refugio: Refugio Patitas')).toBeInTheDocument()
    expect(within(kiara).getByText('Solicitada el 20 oct 2026')).toBeInTheDocument()
  })

  it('offers a shortcut to send a new request', async () => {
    renderPage()
    await screen.findByRole('list', { name: 'Mis solicitudes de convivencia' })

    expect(screen.getByRole('link', { name: 'Nueva solicitud' })).toHaveAttribute(
      'href',
      '/trial-cohabitation-requests/new',
    )
  })

  it('explains when the adopter has not sent any request', async () => {
    getTrialCohabitationRequests.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Aún no has enviado solicitudes de convivencia de prueba.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the error and lets the user retry', async () => {
    const user = userEvent.setup()
    getTrialCohabitationRequests.mockRejectedValueOnce(
      new ApiError('No se pudo conectar con el servidor.', 0),
    )
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('list', { name: 'Mis solicitudes de convivencia' })).toBeInTheDocument()
    expect(getTrialCohabitationRequests).toHaveBeenCalledTimes(2)
  })

  it('only lets an adopter see the requests', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1 })
    renderPage()

    expect(
      screen.getByText('Solo los adoptantes pueden consultar sus solicitudes de convivencia.'),
    ).toBeInTheDocument()
    expect(getTrialCohabitationRequests).not.toHaveBeenCalled()
  })
})
