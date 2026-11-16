import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { setSession } from './config/session'
import { getMedicalEvent, getMedicalEvents } from './services/medicalEventService'
import { getPet, getPets } from './services/petService'
import { getNotification, getNotifications } from './services/notificationService'
import { getShelter, getShelters } from './services/shelterService'
import { getVeterinarian, getVeterinarians } from './services/veterinarianService'

vi.mock('./services/shelterService', () => ({
  createShelter: vi.fn(),
  getShelter: vi.fn(),
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
  deletePet: vi.fn(),
  addPetPhoto: vi.fn(),
}))

vi.mock('./services/medicalEventService', () => ({
  getMedicalEvents: vi.fn(),
  getMedicalEvent: vi.fn(),
  createMedicalEvent: vi.fn(),
  updateMedicalEvent: vi.fn(),
  deleteMedicalEvent: vi.fn(),
}))

vi.mock('./services/notificationService', () => ({
  getNotifications: vi.fn(),
  getNotification: vi.fn(),
  createNotification: vi.fn(),
  updateNotification: vi.fn(),
  deleteNotification: vi.fn(),
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
    setSession(null)
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
    getNotifications.mockResolvedValue([])
    getNotification.mockResolvedValue({ id: 1, message: 'Hola', channel: 'EMAIL', sent: false })
  })

  it('shows the navbar and the veterinarians page', async () => {
    renderAt('/veterinarians')

    expect(screen.getByRole('link', { name: 'Huellitas Seguras' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Veterinarios' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay veterinarios registrados.')).toBeInTheDocument()
  })

  it('shows the home page with a way to explore pets and shelters', async () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', { level: 1, name: /Un hogar cambia una vida/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conocer mascotas' })).toHaveAttribute('href', '/pets')
    expect(screen.getByRole('link', { name: 'Explorar refugios' })).toHaveAttribute(
      'href',
      '/shelters',
    )
  })

  it('shows the pet registration form', () => {
    renderAt('/pets/new')

    expect(screen.getByRole('heading', { name: 'Registre su Mascota' })).toBeInTheDocument()
  })

  it('shows the shelter registration form', () => {
    renderAt('/shelters/new')

    expect(screen.getByRole('heading', { name: 'Registre su Refugio' })).toBeInTheDocument()
  })

  it('shows the searchable pet catalog', async () => {
    renderAt('/pets')

    expect(screen.getByRole('heading', { name: 'Mascotas que buscan un hogar' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Filtros de mascotas' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay mascotas registradas')).toBeInTheDocument()
  })

  it('shows the pet inventory on its dedicated route', async () => {
    setSession({ id: 2, email: 'admin@example.com', role: 'SHELTER_ADMIN', shelterId: 1 })
    getShelter.mockResolvedValue({
      id: 1,
      name: 'Patitas Felices',
      city: 'Bogotá',
      pets: [{ id: 2, name: 'Luna', species: 'Perro', age: 1 }],
    })

    renderAt('/pets/inventory')

    expect(await screen.findByRole('heading', { name: 'Inventario de mascotas' })).toBeInTheDocument()
    expect(screen.getByText('Patitas Felices · Bogotá')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver perfil de Luna' })).toHaveAttribute('href', '/pets/2')
  })

  it('shows the pet profile and its medical history link', async () => {
    renderAt('/pets/1')

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver historia médica' })).toHaveAttribute(
      'href',
      '/pets/1/medical-events',
    )
  })

  it('shows the list of shelters', async () => {
    renderAt('/shelters')

    expect(screen.getByRole('heading', { name: 'Busque un Refugio cerca de usted' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay refugios registrados')).toBeInTheDocument()
  })

  it('shows the shelter detail', async () => {
    getShelter.mockResolvedValue({ id: 1, name: 'Patitas Felices', pets: [], events: [] })

    renderAt('/shelters/1')

    expect(await screen.findByRole('heading', { name: 'Patitas Felices' })).toBeInTheDocument()
  })

  it('shows the medical event registration form on /medical-events/new', async () => {
    renderAt('/medical-events/new')

    expect(await screen.findByRole('heading', { name: 'Registrar evento médico' })).toBeInTheDocument()
  })

  it('shows the medical history of a pet', async () => {
    renderAt('/pets/1/medical-events')

    expect(await screen.findByRole('heading', { name: 'Historia médica' })).toBeInTheDocument()
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

  it('shows the notifications list on /notifications', async () => {
    renderAt('/notifications')

    expect(await screen.findByRole('heading', { name: 'Mis notificaciones' })).toBeInTheDocument()
  })

  it('shows the schedule form on /notifications/new', () => {
    renderAt('/notifications/new')

    expect(screen.getByRole('heading', { name: 'Programar notificación' })).toBeInTheDocument()
  })

  it('shows the form to create a vaccination record', async () => {
    renderAt('/vaccination-records/new')

    expect(
      await screen.findByRole('heading', { name: 'Crear carnet de vacunación' }),
    ).toBeInTheDocument()
  })
})
