import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MedicalEventEditPage from './MedicalEventEditPage'
import { getSession } from '../../config/session'
import { ApiError } from '../../services/apiClient'
import { getMedicalEvent, updateMedicalEvent } from '../../services/medicalEventService'
import { getVeterinarians } from '../../services/veterinarianService'
import { dayStartISO } from '../../utils/dates'

vi.mock('../../services/medicalEventService', () => ({
  getMedicalEvent: vi.fn(),
  updateMedicalEvent: vi.fn(),
}))
vi.mock('../../services/veterinarianService', () => ({ getVeterinarians: vi.fn() }))
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
  veterinarian: { id: 1, firstName: 'Ana', lastName: 'Ruiz', specialization: 'Cirugia' },
}

const VETERINARIANS = [
  { id: 1, firstName: 'Ana', lastName: 'Ruiz', specialization: 'Cirugia', active: true },
  { id: 2, firstName: 'Luis', lastName: 'Pérez', specialization: 'Consulta', active: true },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/medical-events/4/edit']}>
      <Routes>
        <Route path="/medical-events/:medicalEventId/edit" element={<MedicalEventEditPage />} />
        <Route path="/medical-events/:medicalEventId" element={<p>Detalle del evento</p>} />
        <Route path="/pets/:petId/medical-events" element={<p>Historia de la mascota</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const textbox = (name) => screen.getByRole('textbox', { name })
const dateField = () => screen.getByLabelText(/^Fecha del evento/)
const submit = (user) => user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

describe('MedicalEventEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })
    getMedicalEvent.mockResolvedValue(MEDICAL_EVENT)
    getVeterinarians.mockResolvedValue(VETERINARIANS)
    updateMedicalEvent.mockResolvedValue({ ...MEDICAL_EVENT, description: 'Control postoperatorio' })
  })

  it('prefills the form with the current event', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('2026-09-10')).toBeInTheDocument()
    expect(combobox('Tipo de evento')).toHaveValue('Cirugia')
    expect(combobox('Veterinario')).toHaveValue('1')
    expect(textbox('Descripción')).toHaveValue('Esterilización sin complicaciones')
    expect(screen.getByText('Luna — Perro · Criollo')).toBeInTheDocument()
    expect(screen.getByText('La mascota no se puede cambiar.')).toBeInTheDocument()
  })

  it('does not offer a pet selector because the pet cannot change', async () => {
    renderPage()
    await screen.findByDisplayValue('2026-09-10')

    expect(screen.queryByRole('combobox', { name: 'Mascota' })).not.toBeInTheDocument()
    expect(getMedicalEvent).toHaveBeenCalledWith('4')
  })

  it('sends the edited data keeping the same pet', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('2026-09-10')

    fireEvent.change(dateField(), { target: { value: '2026-09-11' } })
    await user.selectOptions(combobox('Veterinario'), '2')
    await user.clear(textbox('Descripción'))
    await user.type(textbox('Descripción'), 'Control postoperatorio')
    await submit(user)

    await waitFor(() =>
      expect(updateMedicalEvent).toHaveBeenCalledWith('4', {
        date: dayStartISO('2026-09-11'),
        type: 'Cirugia',
        description: 'Control postoperatorio',
        pet: { id: 7 },
        veterinarian: { id: 2 },
      }),
    )

    expect(await screen.findByText('¡Evento médico actualizado con éxito!')).toBeInTheDocument()
    expect(screen.getByText('Código HTTP 200 • Actualizado con éxito')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(await screen.findByText('Detalle del evento')).toBeInTheDocument()
  })

  it('validates the form before calling the backend', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('2026-09-10')

    await user.clear(textbox('Descripción'))
    await submit(user)

    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(updateMedicalEvent).not.toHaveBeenCalled()
  })

  it('shows backend field errors next to the field and in the dialog', async () => {
    const user = userEvent.setup()
    updateMedicalEvent.mockRejectedValue(new ApiError('Description is not valid', 412))
    renderPage()
    await screen.findByDisplayValue('2026-09-10')

    await submit(user)

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Description is not valid')).toBeInTheDocument()
    expect(textbox('Descripción')).toHaveAttribute('aria-invalid', 'true')
    expect(textbox('Descripción')).toHaveAttribute('aria-describedby', 'description-error')
  })

  it('shows the load error and lets the user retry', async () => {
    const user = userEvent.setup()
    getMedicalEvent.mockRejectedValueOnce(new ApiError('Medical event was not found', 404))
    renderPage()

    expect(await screen.findByText('Medical event was not found')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByDisplayValue('2026-09-10')).toBeInTheDocument()
    expect(getMedicalEvent).toHaveBeenCalledTimes(2)
  })

  it('explains when there are no veterinarians to choose from', async () => {
    getVeterinarians.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText(
        'No hay veterinarios registrados: registra un veterinario antes de editar el evento.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeInTheDocument()
  })

  it('does not allow a role without permission to edit events', async () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede editar eventos médicos.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeInTheDocument()
  })
})
