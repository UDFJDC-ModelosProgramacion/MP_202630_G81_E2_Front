import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetInventoryPage from './PetInventoryPage'
import { getSession, ROLES } from '../../config/session'
import { deletePet } from '../../services/petService'
import { getShelter } from '../../services/shelterService'

vi.mock('../../config/session', () => ({
  getSession: vi.fn(),
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN' },
}))

vi.mock('../../services/shelterService', () => ({ getShelter: vi.fn() }))
vi.mock('../../services/petService', () => ({ deletePet: vi.fn() }))

const SHELTER = {
  id: 4,
  name: 'Huellas felices',
  city: 'Bogotá',
  pets: [
    {
      id: 21,
      name: 'Luna',
      species: 'Perro',
      breed: 'Criollo',
      age: 2,
      sex: 'Hembra',
      size: 'Mediano',
    },
    { id: 22, name: 'Milo', species: 'Gato', breed: 'Europeo', age: 1, size: 'Pequeño' },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/inventory']}>
      <Routes>
        <Route path="/pets/inventory" element={<PetInventoryPage />} />
        <Route path="/pets/new" element={<p>Registrar mascota</p>} />
        <Route path="/pets/:petId" element={<p>Perfil de mascota</p>} />
        <Route path="/pets" element={<p>Catálogo</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PetInventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: ROLES.SHELTER_ADMIN, shelterId: 4 })
    getShelter.mockResolvedValue(SHELTER)
    deletePet.mockResolvedValue(null)
  })

  it('loads the current shelter inventory and links each pet profile', async () => {
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando inventario de mascotas')
    expect(await screen.findByRole('heading', { name: 'Inventario de mascotas' })).toBeInTheDocument()
    expect(getShelter).toHaveBeenCalledWith(4)
    expect(screen.getByText('Huellas felices · Bogotá')).toBeInTheDocument()
    expect(screen.getByText('2 mascotas registradas')).toBeInTheDocument()

    const rows = within(screen.getByRole('list', { name: 'Mascotas del inventario' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Perro · Criollo · 2 años · Hembra · Mediano')
    expect(within(rows[0]).getByRole('link', { name: 'Ver perfil de Luna' })).toHaveAttribute(
      'href',
      '/pets/21',
    )
    expect(within(rows[0]).getByRole('button', { name: 'Eliminar a Luna' })).toBeInTheDocument()
  })

  it('shows an empty state and keeps a registration action available', async () => {
    getShelter.mockResolvedValue({ ...SHELTER, pets: [] })

    renderPage()

    expect(await screen.findByText('Tu refugio aún no tiene mascotas registradas')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Registrar mascota' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )
    expect(screen.getByText('0 mascotas registradas')).toBeInTheDocument()
  })

  it('denies access to other roles without requesting a shelter', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', shelterId: 4 })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo el administrador del refugio puede consultar el inventario de mascotas.',
    )
    expect(getShelter).not.toHaveBeenCalled()
  })

  it('reports a missing shelter association without making an API request', () => {
    getSession.mockReturnValue({ role: ROLES.SHELTER_ADMIN, shelterId: null })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No hay un refugio asociado a esta sesión de administrador.',
    )
    expect(getShelter).not.toHaveBeenCalled()
  })

  it('shows API errors and lets the administrator retry', async () => {
    const user = userEvent.setup()
    getShelter.mockRejectedValueOnce(new Error('Servicio no disponible')).mockResolvedValueOnce(SHELTER)

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Inventario de mascotas' })).toBeInTheDocument()
    expect(getShelter).toHaveBeenCalledTimes(2)
  })

  it('requires confirmation before deleting a pet', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Inventario de mascotas' })
    await user.click(screen.getByRole('button', { name: 'Eliminar a Luna' }))
    expect(screen.getByRole('alertdialog', { name: '¿Eliminar a Luna?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(deletePet).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
  })

  it('removes the pet and updates the count after a successful deletion', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Inventario de mascotas' })
    await user.click(screen.getByRole('button', { name: 'Eliminar a Luna' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar mascota' }))

    expect(deletePet).toHaveBeenCalledWith(21)
    expect(await screen.findByText('Luna se eliminó correctamente.')).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()
    expect(screen.getByText('1 mascota registrada')).toBeInTheDocument()
  })

  it('shows the backend business-rule message and keeps the pet when deletion is rejected', async () => {
    const user = userEvent.setup()
    deletePet.mockRejectedValueOnce({
      message: 'No se puede eliminar la mascota debido a su historial',
      status: 412,
    })
    renderPage()

    await screen.findByRole('heading', { name: 'Inventario de mascotas' })
    await user.click(screen.getByRole('button', { name: 'Eliminar a Luna' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar mascota' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'No se pudo eliminar a Luna' })
    expect(dialog).toHaveTextContent('No se puede eliminar la mascota debido a su historial')
    expect(dialog).toHaveTextContent('La mascota tiene una relación o historial que impide eliminarla.')
    await user.click(within(dialog).getByRole('button', { name: 'Entendido' }))
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
  })

  it('reloads inventory when the backend reports that the pet no longer exists', async () => {
    const user = userEvent.setup()
    deletePet.mockRejectedValueOnce({ message: 'Mascota no encontrada', status: 404 })
    renderPage()

    await screen.findByRole('heading', { name: 'Inventario de mascotas' })
    await user.click(screen.getByRole('button', { name: 'Eliminar a Luna' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar mascota' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'No se pudo eliminar a Luna' })
    await user.click(within(dialog).getByRole('button', { name: 'Entendido' }))

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(getShelter).toHaveBeenCalledTimes(2)
  })

  it('ignores a response after leaving the page', async () => {
    let resolve
    getShelter.mockReturnValue(new Promise((done) => { resolve = done }))
    const { container, unmount } = renderPage()

    unmount()
    await act(async () => resolve(SHELTER))

    expect(container).toBeEmptyDOMElement()
  })
})
