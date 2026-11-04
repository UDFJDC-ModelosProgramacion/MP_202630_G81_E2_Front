import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MedicalEventsPage from './MedicalEventsPage'
import { ApiError } from '../../services/apiClient'
import { getMedicalEvents } from '../../services/medicalEventService'
import { getPets } from '../../services/petService'

vi.mock('../../services/medicalEventService', () => ({ getMedicalEvents: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', breed: 'Criollo' },
  { id: 2, name: 'Michi', species: 'Gato' },
]

const EVENTS = [
  {
    id: 1,
    date: '2026-01-09',
    type: 'Ingreso',
    description: 'Llegó al refugio',
    pet: PETS[0],
    veterinarian: null,
  },
  {
    id: 2,
    date: '2026-09-10',
    type: 'Cirugia',
    description: 'Esterilización sin complicaciones',
    pet: PETS[0],
    veterinarian: { firstName: 'Ana', lastName: 'Ruiz' },
  },
  {
    id: 3,
    date: '2026-09-12',
    type: 'Consulta',
    description: 'Control posterior',
    pet: PETS[1],
    veterinarian: { firstName: 'Luis', lastName: 'Pérez' },
  },
]

// Applies the filters the way the back-end does for the same request.
function fakeBackend({ petId, type, date } = {}) {
  return EVENTS.filter(
    (event) =>
      (!petId || String(event.pet.id) === petId) &&
      (!type || event.type === type) &&
      (!date || event.date === date),
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
    <MemoryRouter initialEntries={['/medical-events']}>
      <Routes>
        <Route path="/medical-events" element={<MedicalEventsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const dateField = () => screen.getByLabelText('Fecha del evento')
const search = (user) => user.click(screen.getByRole('button', { name: 'Buscar' }))
const list = () => screen.getByRole('list', { name: 'Lista de eventos médicos' })

describe('MedicalEventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPets.mockResolvedValue(PETS)
    getMedicalEvents.mockImplementation(async (filters) => fakeBackend(filters))
  })

  it('lists every event, newest first, with its pet and veterinarian', async () => {
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3))
    expect(getMedicalEvents).toHaveBeenCalledWith({ petId: '', type: '', date: '' })

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('Consulta')).toBeInTheDocument()
    expect(within(items[1]).getByText('Cirugía')).toBeInTheDocument()
    expect(within(items[2]).getByText('Ingreso')).toBeInTheDocument()
    expect(within(items[1]).getByText('Luna — Perro · Criollo')).toBeInTheDocument()
    expect(within(items[1]).getByText('Dr(a). Ana Ruiz')).toBeInTheDocument()
    expect(within(items[2]).getByText('Sin veterinario asignado')).toBeInTheDocument()
  })

  it('offers the pets and the event types as filter options', async () => {
    renderPage()
    await screen.findAllByRole('listitem')

    expect(screen.getByRole('option', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Vacunación' })).toBeInTheDocument()
  })

  it('filters by pet, type and day and sends the filters to the back-end', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByRole('listitem')

    await user.selectOptions(combobox('Mascota'), '1')
    await user.selectOptions(combobox('Tipo de evento'), 'Cirugia')
    fireEvent.change(dateField(), { target: { value: '2026-09-10' } })
    await search(user)

    await waitFor(() =>
      expect(getMedicalEvents).toHaveBeenLastCalledWith({
        petId: '1',
        type: 'Cirugia',
        date: '2026-09-10',
      }),
    )
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
    expect(within(screen.getByRole('listitem')).getByText('Cirugía')).toBeInTheDocument()
  })

  it('explains when no event matches the filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByRole('listitem')

    await user.selectOptions(combobox('Mascota'), '2')
    await user.selectOptions(combobox('Tipo de evento'), 'Vacunacion')
    await search(user)

    expect(
      await screen.findByText('No hay eventos médicos que coincidan con los filtros indicados.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('explains when there are no events at all', async () => {
    getPets.mockResolvedValue([])
    getMedicalEvents.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Aún no hay eventos médicos registrados.')).toBeInTheDocument()
  })

  it('clears the filters and shows every event again', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByRole('listitem')

    await user.selectOptions(combobox('Mascota'), '1')
    await search(user)
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3))
    expect(getMedicalEvents).toHaveBeenLastCalledWith({ petId: '', type: '', date: '' })
    expect(combobox('Mascota')).toHaveValue('')
  })

  it('ignores an answer from an earlier search that arrives late', async () => {
    const user = userEvent.setup()
    const slow = deferred()
    getMedicalEvents.mockImplementation(async (filters) =>
      filters.type === 'Cirugia' ? slow.promise : fakeBackend(filters),
    )
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3))

    await user.selectOptions(combobox('Tipo de evento'), 'Cirugia')
    await search(user)
    await user.selectOptions(combobox('Tipo de evento'), 'Consulta')
    await search(user)
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))

    await act(async () => {
      slow.resolve(fakeBackend({ type: 'Cirugia' }))
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(within(list()).getByRole('link', { name: 'Ver detalle de Consulta' })).toBeInTheDocument()
  })

  it('links each event to its detail', async () => {
    renderPage()
    await screen.findAllByRole('listitem')

    expect(screen.getByRole('link', { name: 'Ver detalle de Cirugía' })).toHaveAttribute(
      'href',
      '/medical-events/2',
    )
  })

  it('links to the registration of a new medical event', async () => {
    renderPage()
    await screen.findAllByRole('listitem')

    expect(screen.getByRole('link', { name: 'Registrar evento médico' })).toHaveAttribute(
      'href',
      '/medical-events/new',
    )
  })

  it('shows the backend message when the list cannot be loaded', async () => {
    getMedicalEvents.mockRejectedValue(new ApiError('Date is not valid', 412))
    renderPage()

    expect(await screen.findByText('Date is not valid')).toBeInTheDocument()
  })
})
