import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MedicalEventHistoryPage from './MedicalEventHistoryPage'
import { ApiError } from '../../services/apiClient'
import { getMedicalEvents } from '../../services/medicalEventService'
import { getPet } from '../../services/petService'

vi.mock('../../services/medicalEventService', () => ({ getMedicalEvents: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPet: vi.fn() }))

const PET = { id: 7, name: 'Luna', species: 'Perro', breed: 'Criollo' }

const EVENTS = [
  {
    id: 1,
    date: '2026-09-05',
    type: 'Vacunacion',
    description: 'Refuerzo de la vacuna antirrábica',
    veterinarian: { firstName: 'Ana', lastName: 'Ruiz' },
  },
  {
    id: 2,
    date: '2026-09-10',
    type: 'Cirugia',
    description: 'Esterilización sin complicaciones',
  },
]

function renderPage(petId = '7') {
  return render(
    <MemoryRouter initialEntries={[`/pets/${petId}/medical-events`]}>
      <Routes>
        <Route path="/pets/:petId/medical-events" element={<MedicalEventHistoryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MedicalEventHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPet.mockResolvedValue(PET)
    getMedicalEvents.mockResolvedValue(EVENTS)
  })

  it('shows the pet and its medical events, newest first', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Historia médica' })).toBeInTheDocument()
    expect(await screen.findByText('Luna — Perro · Criollo')).toBeInTheDocument()
    expect(getMedicalEvents).toHaveBeenCalledWith({ petId: '7' })

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Cirugía')).toBeInTheDocument()
    expect(within(items[0]).getByText('10 sep 2026')).toBeInTheDocument()
    expect(within(items[1]).getByText('Vacunación')).toBeInTheDocument()
    expect(within(items[1]).getByText('5 sep 2026')).toBeInTheDocument()
  })

  it('shows the veterinarian of the event or a message when there is none', async () => {
    renderPage()
    await screen.findByText('Luna — Perro · Criollo')

    expect(screen.getByText('Dr(a). Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Sin veterinario asignado')).toBeInTheDocument()
  })

  it('offers a shortcut to register a new medical event', async () => {
    renderPage()
    await screen.findByText('Luna — Perro · Criollo')

    expect(screen.getByRole('link', { name: 'Registrar evento médico' })).toHaveAttribute(
      'href',
      '/medical-events/new',
    )
  })

  it('shows an empty state when the pet has no events', async () => {
    getMedicalEvents.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Luna aún no tiene eventos médicos registrados.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the error and lets the user retry', async () => {
    const user = userEvent.setup()
    getMedicalEvents.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
    expect(getMedicalEvents).toHaveBeenCalledTimes(2)
  })

  it('shows the backend message when the pet does not exist', async () => {
    getPet.mockRejectedValue(new ApiError('Pet was not found', 404))
    renderPage('999')

    expect(await screen.findByText('Pet was not found')).toBeInTheDocument()
  })
})
