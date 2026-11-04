import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { getMedicalEvent, getMedicalEvents } from './services/medicalEventService'
import { getPet, getPets } from './services/petService'
import { getVeterinarians } from './services/veterinarianService'

vi.mock('./services/veterinarianService', () => ({
  getVeterinarians: vi.fn(),
  getVeterinarian: vi.fn(),
  createVeterinarian: vi.fn(),
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
  })

  it('shows the navbar and the veterinarians page', async () => {
    renderAt('/veterinarians')

    expect(screen.getByText('Pet Adoption Platform')).toBeInTheDocument()
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

  it('keeps the pages of other stories as pending', () => {
    renderAt('/pets')

    expect(screen.getByRole('heading', { name: 'Mascotas (pendiente)' })).toBeInTheDocument()
  })

  it('shows the registration form on /veterinarians/new', () => {
    renderAt('/veterinarians/new')

    expect(screen.getByRole('heading', { name: 'Registre un veterinario' })).toBeInTheDocument()
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
})


