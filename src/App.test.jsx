import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { getMedicalEvent, getMedicalEvents } from './services/medicalEventService'
import { getPet, getPets } from './services/petService'
import { getReviews } from './services/reviewService'
import { getShelters } from './services/shelterService'
import { getVaccinationRecordByPet } from './services/vaccinationRecordService'
import { getVeterinarian, getVeterinarians } from './services/veterinarianService'

vi.mock('./services/reviewService', () => ({
  getReviews: vi.fn(),
  getReview: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}))

vi.mock('./services/vaccinationRecordService', () => ({
  getVaccinationRecordByPet: vi.fn(),
  createVaccinationRecord: vi.fn(),
  deleteVaccinationRecord: vi.fn(),
}))

vi.mock('./services/shelterService', () => ({
  createShelter: vi.fn(),
  getShelters: vi.fn(),
}))

vi.mock('./services/veterinarianService', () => ({
  getVeterinarians: vi.fn(),
  getVeterinarian: vi.fn(),
  createVeterinarian: vi.fn(),
  updateVeterinarian: vi.fn(),
}))

vi.mock('./services/petService', () => ({
  getPets: vi.fn(),
  getPet: vi.fn(),
  createPet: vi.fn(),
  addPetPhoto: vi.fn(),
}))

vi.mock('./services/medicalEventService', () => ({
  getMedicalEvents: vi.fn(),
  getMedicalEvent: vi.fn(),
  createMedicalEvent: vi.fn(),
  updateMedicalEvent: vi.fn(),
  deleteMedicalEvent: vi.fn(),
}))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    getVeterinarians.mockResolvedValue([])
    getPets.mockResolvedValue([])
    getPet.mockResolvedValue({ id: 1, name: 'Luna', species: 'Perro' })
    getMedicalEvents.mockResolvedValue([])
    getMedicalEvent.mockResolvedValue({
      id: 1,
      date: '2026-09-10',
      type: 'Cirugia',
      description: 'Esterilización sin complicaciones',
      pet: { id: 1, name: 'Luna', species: 'Perro' },
      veterinarian: null,
    })
    getShelters.mockResolvedValue([])
    getReviews.mockResolvedValue([])
    getVaccinationRecordByPet.mockResolvedValue({ id: 1, vaccines: [] })
  })

  it('shows the navbar and the veterinarians page', async () => {
    renderAt('/veterinarians')

    expect(screen.getByRole('link', { name: 'Huellitas Seguras' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Veterinarios' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay veterinarios registrados.')).toBeInTheDocument()
  })

  it('sends the home route to the veterinarians page', async () => {
    renderAt('/')

    expect(screen.getByRole('heading', { name: 'Veterinarios' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay veterinarios registrados.')).toBeInTheDocument()
  })

  it('shows the pet registration form', () => {
    renderAt('/pets/new')

    expect(screen.getByRole('heading', { name: 'Registre su Mascota' })).toBeInTheDocument()
  })

  it('shows the shelter registration form', () => {
    renderAt('/shelters/new')

    expect(screen.getByRole('heading', { name: 'Registre su Refugio' })).toBeInTheDocument()
  })

  it('keeps the pages of other stories as unavailable, with a way out', () => {
    renderAt('/pets')

    expect(screen.getByRole('heading', { name: 'Mascotas' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('todavía no está disponible')
    expect(screen.getByRole('link', { name: 'Ir a la lista de refugios' })).toHaveAttribute(
      'href',
      '/shelters',
    )
  })

  it('shows the list of shelters', async () => {
    renderAt('/shelters')

    expect(screen.getByRole('heading', { name: 'Busque un Refugio cerca de usted' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay refugios registrados')).toBeInTheDocument()
  })

  it('shows the medical event registration form on /medical-events/new', () => {
    renderAt('/medical-events/new')

    expect(screen.getByRole('heading', { name: 'Registrar evento médico' })).toBeInTheDocument()
  })

  it('shows the medical history of a pet', () => {
    renderAt('/pets/1/medical-events')

    expect(screen.getByRole('heading', { name: 'Historia médica' })).toBeInTheDocument()
  })

  it('shows the detail of a medical event', async () => {
    renderAt('/medical-events/1')

    expect(await screen.findByRole('heading', { name: 'Cirugía' })).toBeInTheDocument()
  })

  it('shows the medical events list with its filters', async () => {
    renderAt('/medical-events')

    expect(await screen.findByRole('heading', { name: 'Eventos médicos' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Filtros de eventos médicos' })).toBeInTheDocument()
  })

  it('shows the edit form of a medical event', async () => {
    renderAt('/medical-events/1/edit')

    expect(await screen.findByRole('heading', { name: 'Editar evento médico' })).toBeInTheDocument()
  })

  it('shows the update form on /veterinarians/:id/edit', async () => {
    getVeterinarian.mockResolvedValue({
      id: 3,
      firstName: 'Camila',
      lastName: 'Rojas',
      specialization: 'Cirugía',
      availability: 'Lunes a viernes',
    })

    renderAt('/veterinarians/3/edit')

    expect(await screen.findByRole('heading', { name: 'Actualizar veterinario' })).toBeInTheDocument()
  })

  it('shows the reviews of a pet', async () => {
    renderAt('/pets/1/reviews')

    expect(await screen.findByRole('heading', { name: 'Reseñas de Luna' })).toBeInTheDocument()
  })

  it('shows the vaccination record of a pet', async () => {
    renderAt('/pets/1/vaccination-record')

    expect(await screen.findByRole('heading', { name: 'Carnet de vacunación' })).toBeInTheDocument()
  })
})
