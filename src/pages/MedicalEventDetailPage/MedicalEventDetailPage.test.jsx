import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MedicalEventDetailPage from './MedicalEventDetailPage'
import { ApiError } from '../../services/apiClient'
import { getMedicalEvent } from '../../services/medicalEventService'

vi.mock('../../services/medicalEventService', () => ({ getMedicalEvent: vi.fn() }))

const MEDICAL_EVENT = {
  id: 4,
  date: '2026-09-10',
  type: 'Cirugia',
  description: 'Esterilización sin complicaciones',
  pet: { id: 7, name: 'Luna', species: 'Perro', breed: 'Criollo' },
  veterinarian: { firstName: 'Ana', lastName: 'Ruiz' },
}

function renderPage(medicalEventId = '4') {
  return render(
    <MemoryRouter initialEntries={[`/medical-events/${medicalEventId}`]}>
      <Routes>
        <Route path="/medical-events/:medicalEventId" element={<MedicalEventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MedicalEventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMedicalEvent.mockResolvedValue(MEDICAL_EVENT)
  })

  it('shows the full detail of the medical event', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Cirugía' }),
    ).toBeInTheDocument()
    expect(getMedicalEvent).toHaveBeenCalledWith('4')
    expect(screen.getByText('10 sep 2026')).toBeInTheDocument()
    expect(screen.getByText('Luna — Perro · Criollo')).toBeInTheDocument()
    expect(screen.getByText('Dr(a). Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Esterilización sin complicaciones')).toBeInTheDocument()
  })

  it('links the pet to its medical history', async () => {
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

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Cirugía' })).toBeInTheDocument())
    expect(getMedicalEvent).toHaveBeenCalledTimes(2)
  })
})
