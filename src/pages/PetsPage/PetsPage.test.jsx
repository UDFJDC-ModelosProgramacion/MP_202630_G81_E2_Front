import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetsPage from './PetsPage'
import { getPets } from '../../services/petService'
import { getSession, ROLES } from '../../config/session'

vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/session', () => ({
  getSession: vi.fn(),
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN' },
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', breed: 'Criollo', sex: 'Hembra', size: 'Mediano' },
  { id: 2, name: 'Milo', species: 'Gato', breed: 'Europeo', sex: 'Macho', size: 'Pequeño' },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets']}>
      <Routes>
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/:petId" element={<p>Perfil de mascota</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: ROLES.SHELTER_ADMIN })
    getPets.mockResolvedValue(PETS)
  })

  it('lists pets with profile links and an administrator registration action', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Mascotas que buscan un hogar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conocer a Luna' })).toHaveAttribute('href', '/pets/1')
    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute('href', '/pets/new')
  })

  it('filters by text and select criteria, and can clear all filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Luna' })

    await user.selectOptions(screen.getByLabelText('Especie'), 'Gato')
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o raza' }), 'desconocido')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver todas las mascotas' }))
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
  })

  it('shows an empty state and hides the registration action from non-admins', async () => {
    getSession.mockReturnValue({ role: 'VISITOR' })
    getPets.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Aún no hay mascotas registradas')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar mascota' })).not.toBeInTheDocument()
  })

  it('shows API errors and lets the user retry', async () => {
    const user = userEvent.setup()
    getPets.mockRejectedValueOnce(new Error('Servicio no disponible'))
    renderPage()

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(getPets).toHaveBeenCalledTimes(2)
  })
})
