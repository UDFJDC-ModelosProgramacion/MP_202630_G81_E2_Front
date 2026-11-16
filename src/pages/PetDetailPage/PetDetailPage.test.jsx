import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  shelter: { id: 3, name: 'Huellas felices', city: 'Bogotá' },
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/7']}>
      <Routes>
        <Route path="/pets/:petId" element={<PetDetailPage />} />
        <Route path="/pets/:petId/medical-events" element={<p>Historia médica</p>} />
        <Route path="/pets/:petId/reviews" element={<p>Reseñas</p>} />
        <Route path="/pets/:petId/vaccination-record" element={<p>Carnet de vacunación</p>} />
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
    expect(screen.getByText('Temperamento').nextSibling).toHaveTextContent('No registrado')
    expect(screen.getByText('Necesidades específicas').nextSibling).toHaveTextContent('No registrado')
    expect(screen.getByRole('link', { name: 'Huellas felices' }).parentElement).toHaveTextContent(
      'En Huellas felices · Bogotá',
    )
    expect(screen.getByRole('link', { name: 'Ver historia médica' })).toHaveAttribute(
      'href',
      '/pets/7/medical-events',
    )
    expect(screen.getByRole('link', { name: 'Ver reseñas' })).toHaveAttribute(
      'href',
      '/pets/7/reviews',
    )
    expect(screen.getByRole('link', { name: 'Carnet de vacunación' })).toHaveAttribute(
      'href',
      '/pets/7/vaccination-record',
    )
    expect(screen.getByRole('link', { name: 'Huellas felices' })).toHaveAttribute('href', '/shelters/3')
  })

  it('shows backend errors and provides a route back to the catalog', async () => {
    getPet.mockRejectedValue(new Error('Mascota no encontrada'))
    renderPage()

    expect(await screen.findByText('Mascota no encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mascotas' })).toHaveAttribute('href', '/pets')
  })

  it('retries after a failed request', async () => {
    const user = userEvent.setup()
    getPet.mockRejectedValueOnce(new Error('Servicio no disponible')).mockResolvedValueOnce(PET)
    renderPage()

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(getPet).toHaveBeenCalledTimes(2)
  })

  it('uses the fallback when the photo fails and optional profile information is missing', async () => {
    getPet.mockResolvedValue({
      ...PET,
      age: 1,
      description: '',
      temperament: '',
      specificNeeds: ' ',
      photos: [{ url: 'https://example.test/broken.jpg' }],
      shelter: { id: 3 },
    })
    renderPage()

    expect(await screen.findByText('Aún no hay una descripción para esta mascota.')).toBeInTheDocument()
    expect(screen.getByText('Temperamento').nextSibling).toHaveTextContent('No registrado')
    expect(screen.getByText('Necesidades específicas').nextSibling).toHaveTextContent('No registrado')
    expect(screen.getByText('En un refugio')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conocer el refugio' })).toHaveAttribute('href', '/shelters/3')

    const image = screen.getByAltText('Fotografía de Luna')
    fireEvent.error(image)

    expect(screen.queryByAltText('Fotografía de Luna')).not.toBeInTheDocument()
    expect(screen.getByText('Perro · Criollo · 1 año')).toBeInTheDocument()
  })

  it.each([
    ['successful', (request) => request.resolve(PET)],
    ['failed', (request) => request.reject(new Error('late error'))],
  ])('ignores a %s response after leaving the profile', async (_outcome, settle) => {
    const request = deferred()
    getPet.mockReturnValue(request.promise)
    const { container, unmount } = renderPage()

    unmount()
    await act(async () => settle(request))

    expect(container).toBeEmptyDOMElement()
  })
})
