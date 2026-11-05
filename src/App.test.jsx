import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
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
    getShelters.mockResolvedValue([])
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

  it('shows the list of shelters', async () => {
    renderAt('/shelters')

    expect(screen.getByRole('heading', { name: 'Busca un Refugio cerca de Ti' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay refugios registrados')).toBeInTheDocument()
  })
})