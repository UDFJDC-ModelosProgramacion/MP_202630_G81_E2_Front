import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { getPets } from './services/petService'
import { getMedicalEvents } from './services/medicalEventService'
import { getPet, getPets } from './services/petService'
import { getShelters } from './services/shelterService'
import { getVeterinarians } from './services/veterinarianService'

vi.mock('./services/shelterService', () => ({
  createShelter: vi.fn(),
  getShelters: vi.fn(),
}))

vi.mock('./services/veterinarianService', () => ({
  getVeterinarians: vi.fn(),
  getVeterinarian: vi.fn(),
}))

vi.mock('./services/petService', () => ({
  getPets: vi.fn(),
  getPet: vi.fn(),
  createPet: vi.fn(),
  addPetPhoto: vi.fn(),
}))

vi.mock('./services/medicalEventService', () => ({
  getMedicalEvents: vi.fn(),
  createMedicalEvent: vi.fn(),
}))

vi.mock('./services/petService', () => ({
  getPets: vi.fn(),
  createPet: vi.fn(),
  addPetPhoto: vi.fn(),
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
    getShelters.mockResolvedValue([])
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
})

  it('shows the medical event registration form on /medical-events/new', () => {
    renderAt('/medical-events/new')

    expect(screen.getByRole('heading', { name: 'Registrar evento médico' })).toBeInTheDocument()
  })

  it('shows the medical history of a pet', () => {
    renderAt('/pets/1/medical-events')

    expect(screen.getByRole('heading', { name: 'Historia médica' })).toBeInTheDocument()
  })
})