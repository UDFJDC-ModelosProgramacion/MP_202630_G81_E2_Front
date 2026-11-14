import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdopterDetailPage from './AdopterDetailPage'
import { getSession } from '../../config/roleSession'
import { getAdopter } from '../../services/adopterService'

vi.mock('../../services/adopterService', () => ({ getAdopter: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const adopter = {
  id: 7,
  firstName: 'Ana',
  lastName: 'Gómez',
  nationalId: '1001',
  email: 'ana@example.com',
  phone: '3001234567',
  address: 'Calle 10 #5-20',
  occupation: 'Ingeniera',
  earnings: 4500000,
  housingType: 'Apartamento',
  allergies: 'Ninguna',
  hasChildren: false,
  hasOtherPets: true,
  trialCohabitions: [
    {
      id: 3,
      startDate: '2026-09-01T05:00:00.000+00:00',
      endDate: '2026-09-15T05:00:00.000+00:00',
      status: 'FINALIZED',
      observations: 'Periodo finalizado',
      trialCohabitationRequest: { pet: { name: 'Luna' } },
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adopters/7']}>
      <Routes>
        <Route path="/adopters/:adopterId" element={<AdopterDetailPage />} />
        <Route path="/adopters" element={<p>Listado</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN' })
  vi.mocked(getAdopter).mockReset()
  vi.mocked(getAdopter).mockResolvedValue(adopter)
})

describe('AdopterDetailPage', () => {
  it('shows the personal data of the adopter', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Ana Gómez' })).toBeInTheDocument()
    expect(screen.getByText('1001')).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(screen.getByText('Ingeniera')).toBeInTheDocument()
    expect(screen.getByText('Apartamento')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByText('Sí')).toBeInTheDocument()
    expect(getAdopter).toHaveBeenCalledWith('7')
  })

  it('lists the trial cohabitation history with pet, dates and status', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.getByText('1 sep 2026 — 15 sep 2026')).toBeInTheDocument()
    expect(screen.getByText('Periodo finalizado')).toBeInTheDocument()
  })

  it('shows a message when there is no trial cohabitation history', async () => {
    vi.mocked(getAdopter).mockResolvedValue({ ...adopter, trialCohabitions: [] })
    renderPage()

    expect(
      await screen.findByText('Este adoptante no tiene convivencias registradas.'),
    ).toBeInTheDocument()
  })

  it('shows the backend message when the adopter does not exist', async () => {
    vi.mocked(getAdopter).mockRejectedValue(new Error('The adopter with that id does not exist'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The adopter with that id does not exist',
    )
    expect(screen.getByRole('link', { name: 'Volver al listado' })).toBeInTheDocument()
  })

  it('blocks roles other than the shelter administrator', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER' })
    renderPage()

    expect(
      screen.getByText(
        'Solo el administrador del refugio puede consultar el detalle del adoptante.',
      ),
    ).toBeInTheDocument()
    expect(getAdopter).not.toHaveBeenCalled()
  })
})
