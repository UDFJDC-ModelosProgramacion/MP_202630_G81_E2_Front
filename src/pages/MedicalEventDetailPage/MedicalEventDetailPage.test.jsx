import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MedicalEventDetailPage from './MedicalEventDetailPage'
import { getSession } from '../../config/session'
import { ApiError } from '../../services/apiClient'
import { deleteMedicalEvent, getMedicalEvent } from '../../services/medicalEventService'

vi.mock('../../services/medicalEventService', () => ({
  getMedicalEvent: vi.fn(),
  deleteMedicalEvent: vi.fn(),
}))
vi.mock('../../config/session', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const MEDICAL_EVENT = {
  id: 4,
  date: '2026-09-10',
  type: 'Cirugia',
  description: 'Esterilización sin complicaciones',
  pet: { id: 7, name: 'Luna', species: 'Perro', breed: 'Criollo' },
  veterinarian: { firstName: 'Ana', lastName: 'Ruiz', specialization: 'Cirugia' },
}

function HistoryStub() {
  const { state } = useLocation()
  return <p>Historia de la mascota: {state?.deleted}</p>
}

function renderPage(medicalEventId = '4') {
  return render(
    <MemoryRouter initialEntries={[`/medical-events/${medicalEventId}`]}>
      <Routes>
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
        <Route path="/pets/:petId/medical-events" element={<HistoryStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

const deleteButton = () => screen.getByRole('button', { name: 'Eliminar evento' })

describe('MedicalEventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })
    getMedicalEvent.mockResolvedValue(MEDICAL_EVENT)
    deleteMedicalEvent.mockResolvedValue(null)
  })

  it('shows the full detail of the medical event', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Cirugía' })).toBeInTheDocument()
    expect(getMedicalEvent).toHaveBeenCalledWith('4')
    expect(screen.getByText('10 sep 2026')).toBeInTheDocument()
    expect(screen.getByText('Luna — Perro · Criollo')).toBeInTheDocument()
    expect(screen.getByText('Dr(a). Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Esterilización sin complicaciones')).toBeInTheDocument()
  })

  it('links the pet and the back action to its medical history', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    expect(screen.getByRole('link', { name: 'Luna — Perro · Criollo' })).toHaveAttribute(
      'href',
      '/pets/7/medical-events',
    )
    expect(screen.getByRole('link', { name: 'Volver a la historia médica' })).toHaveAttribute(
      'href',
      '/pets/7/medical-events',
    )
  })

  it('shows a message when no veterinarian was assigned', async () => {
    getMedicalEvent.mockResolvedValue({ ...MEDICAL_EVENT, veterinarian: null })
    renderPage()

    expect(await screen.findByText('Sin veterinario asignado')).toBeInTheDocument()
  })

  it('offers editing and deleting to the shelter staff', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    expect(screen.getByRole('link', { name: 'Editar evento' })).toHaveAttribute(
      'href',
      '/medical-events/4/edit',
    )
    expect(deleteButton()).toBeInTheDocument()
  })

  it('hides editing and deleting from the other roles', async () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    expect(screen.queryByRole('link', { name: 'Editar evento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar evento' })).not.toBeInTheDocument()
  })

  it('deletes the event after confirmation and returns to the pet history', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    await user.click(deleteButton())
    const dialog = await screen.findByRole('alertdialog', {
      name: '¿Eliminar este evento médico?',
    })
    expect(dialog).toHaveAccessibleDescription(/Cirugía del 10 sep 2026 se borrará/)
    expect(deleteMedicalEvent).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar evento' }))

    expect(deleteMedicalEvent).toHaveBeenCalledWith('4')
    expect(await screen.findByText('Historia de la mascota: Cirugía')).toBeInTheDocument()
  })

  it('keeps the event when the deletion is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    await user.click(deleteButton())
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(deleteMedicalEvent).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Cirugía' })).toBeInTheDocument()
  })

  it('shows the backend message when the deletion fails and lets the user close it', async () => {
    const user = userEvent.setup()
    deleteMedicalEvent.mockRejectedValue(new ApiError('Medical event was not found', 404))
    renderPage()
    await screen.findByRole('heading', { name: 'Cirugía' })

    await user.click(deleteButton())
    await user.click(
      within(await screen.findByRole('alertdialog', { name: '¿Eliminar este evento médico?' }))
        .getByRole('button', { name: 'Eliminar evento' }),
    )

    const errorDialog = await screen.findByRole('alertdialog', {
      name: 'No se pudo eliminar el evento médico',
    })
    expect(within(errorDialog).getByText('Medical event was not found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cirugía' })).toBeInTheDocument()

    await user.click(within(errorDialog).getByRole('button', { name: 'Cerrar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('shows the backend message when the event does not exist', async () => {
    getMedicalEvent.mockRejectedValue(
      new ApiError('The medical event with that id was not found', 404),
    )
    renderPage('999')

    expect(
      await screen.findByText('The medical event with that id was not found'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mascotas' })).toHaveAttribute(
      'href',
      '/pets',
    )
  })

  it('shows the error and lets the user retry', async () => {
    const user = userEvent.setup()
    getMedicalEvent.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Cirugía' })).toBeInTheDocument(),
    )
    expect(getMedicalEvent).toHaveBeenCalledTimes(2)
  })
})
