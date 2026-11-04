import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrialCohabitationReceivedPage from './TrialCohabitationReceivedPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getPets } from '../../services/petService'
import { getTrialCohabitationRequests } from '../../services/trialCohabitationService'

vi.mock('../../services/trialCohabitationService', () => ({
  getTrialCohabitationRequests: vi.fn(),
}))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', active: true, shelter: { id: 1, name: 'Refugio Patitas' } },
  { id: 3, name: 'Kiara', species: 'Gato', active: false, shelter: { id: 1, name: 'Refugio Patitas' } },
  { id: 2, name: 'Michi', species: 'Gato', active: true, shelter: { id: 2, name: 'Refugio Huellas' } },
]

const REQUESTS = [
  {
    id: 1,
    status: 'PENDING',
    date: '2026-11-03',
    description: 'Quiero convivir con Luna',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    pet: PETS[0],
    adopter: { firstName: 'Carlos', lastName: 'Perez', email: 'carlos@mail.com', phone: '3000000000' },
  },
  {
    id: 2,
    status: 'APPROVED',
    date: '2026-10-20',
    description: 'Convivencia con Kiara',
    startDate: '2026-10-25T05:00:00.000+00:00',
    endDate: '2026-10-27T05:00:00.000+00:00',
    pet: PETS[1],
    adopter: { firstName: 'Ana', lastName: 'Gomez', email: 'ana@mail.com', phone: '3111111111' },
  },
  {
    id: 3,
    status: 'PENDING',
    date: '2026-11-01',
    description: 'Convivencia con Michi',
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    pet: PETS[2],
    adopter: { firstName: 'Luis', lastName: 'Diaz', email: 'luis@mail.com', phone: '3222222222' },
  },
]

// Applies the filters the way the back-end does for the same request.
function fakeBackend({ petId, status } = {}) {
  return REQUESTS.filter(
    (request) =>
      (petId === undefined || petId === '' || String(request.pet.id) === String(petId)) &&
      (!status || request.status === status),
  )
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trial-cohabitation-requests/received']}>
      <Routes>
        <Route
          path="/trial-cohabitation-requests/received"
          element={<TrialCohabitationReceivedPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const search = (user) => user.click(screen.getByRole('button', { name: 'Buscar' }))
const list = () => screen.getByRole('list', { name: 'Solicitudes de convivencia recibidas' })

describe('TrialCohabitationReceivedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    getPets.mockResolvedValue(PETS)
    getTrialCohabitationRequests.mockImplementation(async (filters) => fakeBackend(filters))
  })

  it('only lets the shelter staff see the requests received', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede ver las solicitudes recibidas.'),
    ).toBeInTheDocument()
    expect(getTrialCohabitationRequests).not.toHaveBeenCalled()
  })

  it('lists the requests of the shelter pets only, newest first', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    const [luna, kiara] = screen.getAllByRole('listitem')
    expect(within(luna).getByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(within(kiara).getByRole('heading', { name: 'Kiara — Gato' })).toBeInTheDocument()
    expect(screen.queryByText('Adoptante: Luis Diaz')).not.toBeInTheDocument()
    expect(getTrialCohabitationRequests).not.toHaveBeenCalledWith(expect.objectContaining({ petId: 2 }))
  })

  it('shows the adopter contact, the status and the period of each request', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    const [luna] = screen.getAllByRole('listitem')
    expect(within(luna).getByText('Adoptante: Carlos Perez')).toBeInTheDocument()
    expect(within(luna).getByText('carlos@mail.com · 3000000000')).toBeInTheDocument()
    expect(within(luna).getByText('Pendiente')).toBeInTheDocument()
    expect(within(luna).getByText('10 nov 2026')).toBeInTheDocument()
    expect(within(luna).getByText('20 nov 2026')).toBeInTheDocument()
    expect(within(luna).getByText('(11 días)')).toBeInTheDocument()
  })

  it('filters by pet and asks the back-end only for that pet', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.selectOptions(combobox('Mascota'), '3')
    await search(user)

    await waitFor(() =>
      expect(getTrialCohabitationRequests).toHaveBeenLastCalledWith({ petId: 3, status: '' }),
    )
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
    expect(within(screen.getByRole('listitem')).getByText('Adoptante: Ana Gomez')).toBeInTheDocument()
  })

  it('filters by status across the pets of the shelter', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.selectOptions(combobox('Estado'), 'PENDING')
    await search(user)

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
    expect(within(screen.getByRole('listitem')).getByText('Adoptante: Carlos Perez')).toBeInTheDocument()
    expect(getTrialCohabitationRequests).toHaveBeenLastCalledWith({ petId: 3, status: 'PENDING' })
  })

  it('explains when no request matches the filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.selectOptions(combobox('Estado'), 'REJECTED')
    await search(user)

    expect(
      await screen.findByText('No hay solicitudes que coincidan con los filtros indicados.'),
    ).toBeInTheDocument()
  })

  it('explains when the shelter has no requests yet', async () => {
    getTrialCohabitationRequests.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Tu refugio aún no tiene solicitudes de convivencia de prueba.'),
    ).toBeInTheDocument()
  })

  it('explains when the shelter has no pets and does not query the requests', async () => {
    getPets.mockResolvedValue([PETS[2]])
    renderPage()

    expect(await screen.findByText('Tu refugio aún no tiene mascotas registradas.')).toBeInTheDocument()
    expect(getTrialCohabitationRequests).not.toHaveBeenCalled()
  })

  it('clears the filters and shows the requests of every pet again', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.selectOptions(combobox('Estado'), 'PENDING')
    await search(user)
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
    expect(combobox('Estado')).toHaveValue('')
  })

  it('ignores an answer from an earlier search that arrives late', async () => {
    const user = userEvent.setup()
    const slow = deferred()
    getTrialCohabitationRequests.mockImplementation(async (filters) =>
      filters.status === 'APPROVED' ? slow.promise : fakeBackend(filters),
    )
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.selectOptions(combobox('Estado'), 'APPROVED')
    await search(user)
    await user.selectOptions(combobox('Estado'), 'PENDING')
    await search(user)
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))

    await act(async () => {
      slow.resolve(fakeBackend({ status: 'APPROVED' }))
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(within(list()).getByText('Adoptante: Carlos Perez')).toBeInTheDocument()
  })

  it('shows the error when the pets cannot be loaded', async () => {
    getPets.mockRejectedValue(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })
})
