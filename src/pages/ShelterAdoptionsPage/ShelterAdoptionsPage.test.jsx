import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ShelterAdoptionsPage from './ShelterAdoptionsPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getAdoptions } from '../../services/adoptionService'
import { getPets } from '../../services/petService'

vi.mock('../../services/adoptionService', () => ({ getAdoptions: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', shelter: { id: 1 } },
  { id: 3, name: 'Kiara', species: 'Gato', shelter: { id: 1 } },
  { id: 2, name: 'Michi', species: 'Gato', shelter: { id: 2 } },
]

const ADOPTIONS = [
  {
    id: 1,
    date: '2026-11-08',
    status: 'IN_PROGRESS',
    importantNotes: 'Revisar vacunas cada mes',
    pet: PETS[0],
    shelter: { id: 1 },
    adopter: { firstName: 'Carlos', lastName: 'Perez' },
  },
  {
    id: 2,
    date: '2026-09-20',
    status: 'FINALIZED',
    importantNotes: 'Sin novedades',
    pet: PETS[1],
    shelter: { id: 1 },
    adopter: { firstName: 'Ana', lastName: 'Gomez' },
  },
  {
    id: 3,
    date: '2026-10-01',
    status: 'CANCELLED',
    importantNotes: 'Adopción cancelada',
    pet: PETS[0],
    shelter: { id: 1 },
    adopter: { firstName: 'Luis', lastName: 'Diaz' },
  },
  {
    id: 4,
    date: '2026-11-02',
    status: 'IN_PROGRESS',
    importantNotes: 'Adopción de otro refugio',
    pet: PETS[2],
    shelter: { id: 2 },
    adopter: { firstName: 'Eva', lastName: 'Lopez' },
  },
]

// Applies the filters the way the back-end does for the same request.
function fakeBackend({ shelterId, petId, status }) {
  return ADOPTIONS.filter(
    (adoption) =>
      String(adoption.shelter.id) === String(shelterId) &&
      (!petId || String(adoption.pet.id) === String(petId)) &&
      (!status || adoption.status === status),
  )
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function renderPage(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/adoptions/shelter', state }]}>
      <ShelterAdoptionsPage />
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const search = (user) => user.click(screen.getByRole('button', { name: 'Buscar' }))
const list = () => screen.getByRole('list', { name: 'Adopciones del refugio' })

describe('ShelterAdoptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    getPets.mockResolvedValue(PETS)
    getAdoptions.mockImplementation(async (filters) => fakeBackend(filters))
  })

  it('only lets the shelter staff see the adoptions of the shelter', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede consultar las adopciones del refugio.'),
    ).toBeInTheDocument()
    expect(getAdoptions).not.toHaveBeenCalled()
  })

  it('confirms an adoption that was just deleted', async () => {
    renderPage({ deleted: 'Luna' })

    expect(await screen.findByText('Se eliminó la adopción de Luna.')).toBeInTheDocument()
  })

  it('lists only the adoptions of the shelter, newest first', async () => {
    renderPage()

    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))
    expect(getAdoptions).toHaveBeenCalledWith({ shelterId: 1 })

    const items = within(list()).getAllByRole('listitem')
    expect(within(items[0]).getByText('Adoptante: Carlos Perez')).toBeInTheDocument()
    expect(within(items[1]).getByText('Adoptante: Luis Diaz')).toBeInTheDocument()
    expect(within(items[2]).getByText('Adoptante: Ana Gomez')).toBeInTheDocument()
    expect(screen.queryByText('Adoptante: Eva Lopez')).not.toBeInTheDocument()
  })

  it('offers only the pets of the shelter in the pet filter', async () => {
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    expect(screen.getByRole('option', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Kiara — Gato' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Michi — Gato' })).not.toBeInTheDocument()
  })

  it('filters by pet and sends the filter to the back-end', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Mascota'), '1')
    await search(user)

    await waitFor(() =>
      expect(getAdoptions).toHaveBeenLastCalledWith({ shelterId: 1, petId: '1', status: '' }),
    )
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(2))
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Estado'), 'FINALIZED')
    await search(user)

    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(1))
    expect(screen.getByText('Adoptante: Ana Gomez')).toBeInTheDocument()
  })

  it('combines the filters and explains when nothing matches', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Mascota'), '3')
    await user.selectOptions(combobox('Estado'), 'IN_PROGRESS')
    await search(user)

    expect(
      await screen.findByText('No hay adopciones que coincidan con los filtros indicados.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('explains when the shelter has no adoptions yet', async () => {
    getAdoptions.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Tu refugio aún no tiene adopciones registradas.'),
    ).toBeInTheDocument()
  })

  it('explains when the shelter has no pets', async () => {
    getPets.mockResolvedValue([PETS[2]])
    getAdoptions.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Tu refugio aún no tiene mascotas registradas.')).toBeInTheDocument()
  })

  it('clears the filters and shows every adoption again', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Mascota'), '1')
    await search(user)
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))
    expect(combobox('Mascota')).toHaveValue('')
  })

  it('ignores an answer from an earlier search that arrives late', async () => {
    const user = userEvent.setup()
    const slow = deferred()
    getAdoptions.mockImplementation(async (filters) =>
      filters.status === 'CANCELLED' ? slow.promise : fakeBackend(filters),
    )
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Estado'), 'CANCELLED')
    await search(user)
    await user.selectOptions(combobox('Estado'), 'IN_PROGRESS')
    await search(user)
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(1))

    await act(async () => {
      slow.resolve(fakeBackend({ shelterId: 1, status: 'CANCELLED' }))
    })

    expect(within(list()).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Adoptante: Carlos Perez')).toBeInTheDocument()
    expect(screen.queryByText('Adoptante: Luis Diaz')).not.toBeInTheDocument()
  })

  it('links each adoption to its detail', async () => {
    renderPage()
    await waitFor(() => expect(within(list()).getAllByRole('listitem')).toHaveLength(3))

    expect(
      screen.getByRole('link', { name: 'Ver detalle de la adopción de Luna por Carlos Perez' }),
    ).toHaveAttribute('href', '/adoptions/1')
  })

  it('shows the error when the adoptions cannot be loaded', async () => {
    getAdoptions.mockRejectedValue(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })
})
