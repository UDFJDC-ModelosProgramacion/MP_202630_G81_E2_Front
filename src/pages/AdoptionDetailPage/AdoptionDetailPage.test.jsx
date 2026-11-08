import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdoptionDetailPage from './AdoptionDetailPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getAdoption } from '../../services/adoptionService'

vi.mock('../../services/adoptionService', () => ({ getAdoption: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const ADOPTION = {
  id: 1,
  date: '2026-11-08',
  status: 'IN_PROGRESS',
  importantNotes: 'Revisar vacunas cada mes',
  pet: { id: 1, name: 'Luna', species: 'Perro', shelter: { id: 1, name: 'Refugio Patitas' } },
  shelter: { id: 1, name: 'Refugio Patitas' },
  adopter: { id: 2, firstName: 'Carlos', lastName: 'Perez', email: 'carlos@mail.com', phone: '3000000000' },
  adoptionRequest: { id: 11, date: '2026-11-05' },
  reviews: [
    { id: 1, rating: 5, comment: 'Excelente adopción', date: '2026-11-06', time: '2026-11-06T15:00:00.000+00:00' },
    { id: 2, rating: 4, comment: 'Muy buena adaptación', date: '2026-11-10', time: '2026-11-10T15:00:00.000+00:00' },
  ],
  followUps: [{ id: 1, date: '2026-11-15', observation: 'Luna se adapta bien' }],
}

function renderPage(adoptionId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/adoptions/${adoptionId}`]}>
      <Routes>
        <Route path="/adoptions/:adoptionId" element={<AdoptionDetailPage />} />
        <Route path="/adoptions/mine" element={<p>Mis adopciones</p>} />
        <Route path="/pets" element={<p>Mascotas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdoptionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    getAdoption.mockResolvedValue(ADOPTION)
  })

  it('shows the details of the adoption to the adopter who takes part in it', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(getAdoption).toHaveBeenCalledWith('1')
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument()
    expect(screen.getByText('carlos@mail.com · 3000000000')).toBeInTheDocument()
    expect(screen.getByText('8 nov 2026')).toBeInTheDocument()
    expect(screen.getByText('#11')).toBeInTheDocument()
    expect(screen.getByText('Revisar vacunas cada mes')).toBeInTheDocument()
  })

  it('lists the reviews and the follow-ups, newest first', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    const reviews = screen.getByRole('region', { name: 'Reseñas' })
    const reviewItems = within(reviews).getAllByRole('listitem')
    expect(within(reviewItems[0]).getByText('Calificación: 4')).toBeInTheDocument()
    expect(within(reviewItems[0]).getByText('Muy buena adaptación')).toBeInTheDocument()
    expect(within(reviewItems[1]).getByText('Calificación: 5')).toBeInTheDocument()
    expect(within(reviewItems[1]).getByText('6 nov 2026')).toBeInTheDocument()

    const followUps = screen.getByRole('region', { name: 'Seguimientos' })
    expect(within(followUps).getByText('15 nov 2026')).toBeInTheDocument()
    expect(within(followUps).getByText('Luna se adapta bien')).toBeInTheDocument()
  })

  it('explains when the adoption has no reviews or follow-ups yet', async () => {
    getAdoption.mockResolvedValue({ ...ADOPTION, reviews: [], followUps: [] })
    renderPage()

    expect(await screen.findByText('Esta adopción aún no tiene reseñas.')).toBeInTheDocument()
    expect(screen.getByText('Esta adopción aún no tiene seguimientos.')).toBeInTheDocument()
  })

  it('shows the same adoption to the shelter that owns the pet', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mascotas' })).toHaveAttribute('href', '/pets')
  })

  it('links the adopter back to their adoptions', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    expect(screen.getByRole('link', { name: 'Volver a mis adopciones' })).toHaveAttribute(
      'href',
      '/adoptions/mine',
    )
  })

  it('denies the adoption to an adopter who does not take part in it', async () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 9 })
    renderPage()

    expect(await screen.findByText('No tienes acceso a esta adopción.')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Perez')).not.toBeInTheDocument()
  })

  it('denies the adoption to a shelter that does not own the pet', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 5, shelterId: 2 })
    renderPage()

    expect(await screen.findByText('No tienes acceso a esta adopción.')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Perez')).not.toBeInTheDocument()
  })

  it('shows the back-end message when the adoption does not exist', async () => {
    getAdoption.mockRejectedValue(new ApiError('The adoption with the given id was not found', 404))
    renderPage('999')

    expect(
      await screen.findByText('The adoption with the given id was not found'),
    ).toBeInTheDocument()
  })

  it('lets the user retry after a connection error', async () => {
    const user = userEvent.setup()
    getAdoption.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    await waitFor(() => expect(getAdoption).toHaveBeenCalledTimes(2))
  })
})
