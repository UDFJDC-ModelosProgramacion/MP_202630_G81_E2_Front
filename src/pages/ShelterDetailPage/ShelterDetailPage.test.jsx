import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ShelterDetailPage from './ShelterDetailPage'
import { getSession } from '../../config/session'
import { getShelter } from '../../services/shelterService'
import { ApiError } from '../../services/apiClient'

vi.mock('../../services/shelterService', () => ({
  getShelter: vi.fn(),
}))

vi.mock('../../config/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getSession: vi.fn(),
}))

const ADMIN = { userId: 1, name: 'AdminUser', role: 'SHELTER_ADMIN', shelterId: 1 }
const ADOPTER = { userId: 9, name: 'Ana', role: 'ADOPTER', shelterId: 1 }

const SHELTER = {
  id: 1,
  name: 'Fundación Patitas Felices',
  city: 'Bogotá',
  nit: '9014587123',
  location: 'Calle 127 # 45-20',
  users: [{ id: 1 }],
  pets: [
    { id: 11, name: 'Luna', species: 'Perro', breed: 'Criollo', age: 2, size: 'Mediano' },
    { id: 12, name: 'Milo', species: 'Gato', breed: 'Europeo Común', age: 1, size: 'Pequeño' },
  ],
  events: [
    {
      id: 21,
      name: 'Jornada de Adopción Sabatina',
      date: '2026-10-28T09:00:00',
      location: 'Parque El Virrey',
      type: 'Adopción',
    },
  ],
}

function renderAt(path = '/shelters/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/shelters/:shelterId" element={<ShelterDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const apiError = (message, status) => new ApiError(message, status)

describe('ShelterDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue(ADOPTER)
  })

  it('shows a loading state and then the name, city, NIT and location', async () => {
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando refugio...')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Fundación Patitas Felices' }),
    ).toBeInTheDocument()
    expect(getShelter).toHaveBeenCalledWith('1')
    expect(screen.getByText('NIT').nextSibling).toHaveTextContent('9014587123')
    expect(screen.getByText('Dirección').nextSibling).toHaveTextContent('Calle 127 # 45-20')
    expect(screen.getByText('Ciudad').nextSibling).toHaveTextContent('Bogotá')
  })

  it('lists every pet with its data and a link to its profile', async () => {
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    const pets = within(await screen.findByRole('list', { name: 'Mascotas del refugio' }))
    const rows = pets.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Luna')
    expect(rows[0]).toHaveTextContent('Perro · Criollo · 2 años · Mediano')
    expect(rows[1]).toHaveTextContent('Gato · Europeo Común · 1 año · Pequeño')
    expect(pets.getByRole('link', { name: 'Ver perfil de Luna' })).toHaveAttribute('href', '/pets/11')
    expect(screen.getByText('2 mascotas en total')).toBeInTheDocument()
  })

  it('lists every event with its date, time and place, and a link to its detail', async () => {
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    const events = within(await screen.findByRole('list', { name: 'Eventos del refugio' }))
    const [row] = events.getAllByRole('listitem')
    expect(row).toHaveTextContent('Jornada de Adopción Sabatina')
    expect(row).toHaveTextContent('28 oct 2026 · 09:00 · Parque El Virrey')
    expect(row).toHaveTextContent('Adopción')
    expect(events.getByRole('link', { name: 'Ver detalle de Jornada de Adopción Sabatina' })).toHaveAttribute(
      'href',
      '/events/21',
    )
  })

  it('shows an empty message in each section that has nothing to list', async () => {
    getShelter.mockResolvedValue({ ...SHELTER, pets: [], events: [] })

    renderAt()

    expect(await screen.findByText('Este refugio aún no tiene mascotas registradas.')).toBeInTheDocument()
    expect(screen.getByText('Este refugio aún no tiene eventos programados.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('keeps one section filled when only the other one is empty', async () => {
    getShelter.mockResolvedValue({ ...SHELTER, events: [] })

    renderAt()

    expect(await screen.findByRole('list', { name: 'Mascotas del refugio' })).toBeInTheDocument()
    expect(screen.getByText('Este refugio aún no tiene eventos programados.')).toBeInTheDocument()
    expect(screen.queryByText('Este refugio aún no tiene mascotas registradas.')).not.toBeInTheDocument()
  })

  it('does not show what belongs to other modules even if the response includes it', async () => {
    getShelter.mockResolvedValue({
      ...SHELTER,
      veterinarians: [{ id: 3, firstName: 'Camila', lastName: 'Rojas' }],
      adopters: [{ id: 4, name: 'Pedro Adoptante' }],
      adoptions: [{ id: 5, state: 'Aprobada' }],
      returns: [{ id: 6, reason: 'Alergia' }],
      adopterRequests: [{ id: 7, message: 'Quiero adoptar' }],
    })

    renderAt()

    await screen.findByRole('heading', { level: 1 })
    ;['Camila', 'Pedro Adoptante', 'Aprobada', 'Alergia', 'Quiero adoptar'].forEach((text) => {
      expect(screen.queryByText(new RegExp(text))).not.toBeInTheDocument()
    })
  })

  it('shows "Shelter not found" with a link back to the list on a 404', async () => {
    getShelter.mockRejectedValue(apiError('Shelter not found', 404))

    renderAt('/shelters/99')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Shelter not found')
    expect(within(alert).getByRole('link', { name: 'Volver a la lista de refugios' })).toHaveAttribute(
      'href',
      '/shelters',
    )
  })

  it('shows the title and the message of the back-end when they differ', async () => {
    getShelter.mockRejectedValue(apiError('No existe el refugio con id 99', 404))

    renderAt('/shelters/99')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Shelter not found')
    expect(alert).toHaveTextContent('No existe el refugio con id 99')
  })

  it('shows "Shelter id is not valid" on a 412', async () => {
    getShelter.mockRejectedValue(apiError('Error 412', 412))

    renderAt('/shelters/abc')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Shelter id is not valid')
    expect(alert).not.toHaveTextContent('Error 412')
  })

  it('explains other errors, such as a lost connection', async () => {
    getShelter.mockRejectedValue(apiError('No se pudo conectar con el servidor. Inténtelo de nuevo.', 0))

    renderAt()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo cargar el refugio')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor')
  })

  it('shows the administrator of the shelter the actions to edit, delete, register a pet and create an event', async () => {
    getSession.mockReturnValue(ADMIN)
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    expect(await screen.findByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/shelters/1/edit')
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
    expect(screen.getByRole('link', { name: '+ Registrar mascota' })).toHaveAttribute('href', '/pets/new')
    expect(screen.getByRole('link', { name: '+ Crear evento' })).toHaveAttribute(
      'href',
      '/shelters/1/events/new',
    )
  })

  it('shows them also in an empty shelter, so the administrator can start filling it', async () => {
    getSession.mockReturnValue(ADMIN)
    getShelter.mockResolvedValue({ ...SHELTER, pets: [], events: [] })

    renderAt()

    expect(await screen.findByRole('link', { name: '+ Registrar mascota' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+ Crear evento' })).toBeInTheDocument()
  })

  it('hides the actions from an adopter or visitor', async () => {
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '+ Registrar mascota' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '+ Crear evento' })).not.toBeInTheDocument()
  })

  it('hides the actions from the administrator of another shelter', async () => {
    getSession.mockReturnValue({ ...ADMIN, userId: 2, shelterId: 5 })
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('has a breadcrumb back to the list of shelters', async () => {
    getShelter.mockResolvedValue(SHELTER)

    renderAt()

    const breadcrumb = await screen.findByRole('navigation', { name: 'Ruta de navegación' })
    expect(within(breadcrumb).getByRole('link', { name: 'Refugios' })).toHaveAttribute('href', '/shelters')
    expect(within(breadcrumb).getByText('Fundación Patitas Felices')).toHaveAttribute('aria-current', 'page')
  })

  it('uses the singular in the total when the shelter has one pet', async () => {
    getShelter.mockResolvedValue({ ...SHELTER, pets: [SHELTER.pets[0]] })

    renderAt()

    expect(await screen.findByText('1 mascota en total')).toBeInTheDocument()
  })

  it('ignores the answer if the user leaves before it arrives', async () => {
    let resolve
    getShelter.mockReturnValue(new Promise((done) => (resolve = done)))
    const { unmount, container } = renderAt()

    unmount()
    await act(async () => resolve(SHELTER))

    expect(container).toBeEmptyDOMElement()
  })

  it('ignores the error if the user leaves before it arrives', async () => {
    let reject
    getShelter.mockReturnValue(new Promise((_, fail) => (reject = fail)))
    const { unmount, container } = renderAt()

    unmount()
    await act(async () => reject(apiError('Shelter not found', 404)))

    expect(container).toBeEmptyDOMElement()
  })
})
