import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetDetailPage from './PetDetailPage'
import { getPet } from '../../services/petService'

vi.mock('../../services/petService', () => ({ getPet: vi.fn() }))

const PET = {
  id: 7,
  name: 'Luna',
  species: 'Perro',
  breed: 'Criollo',
  age: 2,
  sex: 'Hembra',
  size: 'Mediano',
  healthStatus: 'Saludable',
  admissionDate: '2026-09-10',
  activityLevel: 'Alto',
  requiredSpace: 'Casa',
  compatibilityChildren: true,
  compatibilityOtherPets: false,
  description: 'Muy cariñosa',
  photos: [{ url: 'https://example.test/luna.jpg' }],
  shelter: { id: 3, name: 'Huellas felices' },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/7']}>
      <Routes>
        <Route path="/pets/:petId" element={<PetDetailPage />} />
        <Route path="/pets/:petId/medical-events" element={<p>Historia médica</p>} />
        <Route path="/shelters/:shelterId" element={<p>Refugio</p>} />
        <Route path="/pets" element={<p>Lista de mascotas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PetDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPet.mockResolvedValue(PET)
  })

  it('shows the pet profile, photo, compatibility, shelter, and medical history action', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByAltText('Fotografía de Luna')).toHaveAttribute('src', PET.photos[0].url)
    expect(screen.getByText('Muy cariñosa')).toBeInTheDocument()
    expect(screen.getByText('Saludable')).toBeInTheDocument()
    expect(screen.getByText('Sí')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver historia médica' })).toHaveAttribute(
      'href',
      '/pets/7/medical-events',
    )
    expect(screen.getByRole('link', { name: 'Huellas felices' })).toHaveAttribute('href', '/shelters/3')
  })

  it('shows backend errors and provides a route back to the catalog', async () => {
    getPet.mockRejectedValue(new Error('Mascota no encontrada'))
    renderPage()

    expect(await screen.findByText('Mascota no encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mascotas' })).toHaveAttribute('href', '/pets')
  })
})
