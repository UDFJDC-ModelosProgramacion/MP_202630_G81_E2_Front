import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import VeterinarianProfilePage from './VeterinarianProfilePage'
import { getVeterinarian } from '../../services/veterinarianService'

vi.mock('../../services/veterinarianService', () => ({
  getVeterinarians: vi.fn(),
  getVeterinarian: vi.fn(),
  createVeterinarian: vi.fn(),
}))

const VETERINARIAN = {
  id: 3,
  firstName: 'Laura',
  lastName: 'Gómez',
  email: 'laura@patitas.org',
  phone: '3001234567',
  specialization: 'Medicina general',
  availability: 'Lunes a viernes',
  followUps: [{ id: 10, date: '2026-03-12T05:00:00.000+00:00', observation: 'Buena evolución' }],
  medicalEvents: [
    { id: 20, date: '2026-04-01', type: 'Consulta general', description: 'Revisión de rutina' },
  ],
}

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/veterinarians/3']}>
      <Routes>
        <Route path="/veterinarians/:veterinarianId" element={<VeterinarianProfilePage />} />
        <Route path="/veterinarians" element={<h1>Listado</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VeterinarianProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the veterinarian with their follow-ups and medical events', async () => {
    getVeterinarian.mockResolvedValue(VETERINARIAN)

    renderProfile()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    expect(await screen.findByRole('heading', { name: 'Laura Gómez' })).toBeInTheDocument()
    expect(getVeterinarian).toHaveBeenCalledWith('3')
    expect(screen.getByText('laura@patitas.org')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByText('Medicina general')).toBeInTheDocument()
    expect(screen.getByText('Lunes a viernes')).toBeInTheDocument()
    expect(screen.getByText('12 mar 2026:')).toBeInTheDocument()
    expect(screen.getByText('Buena evolución')).toBeInTheDocument()
    expect(screen.getByText('1 abr 2026 · Consulta general:')).toBeInTheDocument()
    expect(screen.getByText('Revisión de rutina')).toBeInTheDocument()
  })

  it('explains when there are no follow-ups or medical events', async () => {
    getVeterinarian.mockResolvedValue({ ...VETERINARIAN, followUps: [], medicalEvents: [] })

    renderProfile()

    expect(
      await screen.findByText('Este veterinario no tiene seguimientos asociados.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Este veterinario no tiene eventos médicos asociados.'),
    ).toBeInTheDocument()
  })

  it('tolerates an answer without the lists', async () => {
    getVeterinarian.mockResolvedValue({
      ...VETERINARIAN,
      followUps: undefined,
      medicalEvents: undefined,
    })

    renderProfile()

    expect(
      await screen.findByText('Este veterinario no tiene seguimientos asociados.'),
    ).toBeInTheDocument()
  })

  it('shows the backend error and a way back to the list', async () => {
    getVeterinarian.mockRejectedValue(new Error('Veterinarian not found'))

    renderProfile()

    expect(await screen.findByRole('alert')).toHaveTextContent('Veterinarian not found')
    expect(screen.getByRole('link', { name: 'Volver al listado' })).toHaveAttribute(
      'href',
      '/veterinarians',
    )
  })
})
