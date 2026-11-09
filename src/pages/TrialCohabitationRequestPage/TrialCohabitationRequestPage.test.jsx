import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrialCohabitationRequestPage from './TrialCohabitationRequestPage'
import {
  END_BEFORE_START_MESSAGE,
  PET_REQUIRED_MESSAGE,
  REQUIRED_MESSAGE,
  START_IN_PAST_MESSAGE,
} from './trialCohabitationForm'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getPets } from '../../services/petService'
import { createTrialCohabitationRequest } from '../../services/trialCohabitationService'
import { dayStartISO, todayISO } from '../../utils/dates'

vi.mock('../../services/trialCohabitationService', () => ({
  createTrialCohabitationRequest: vi.fn(),
}))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', active: true, shelter: { id: 1, name: 'Refugio Patitas' } },
  { id: 2, name: 'Michi', species: 'Gato', active: false, shelter: { id: 1, name: 'Refugio Patitas' } },
  { id: 3, name: 'Kiara', species: 'Perro', shelter: { id: 2, name: 'Refugio Huellas' } },
]

// Real days relative to today, so the validation of the start date does not expire.
function daysFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trial-cohabitation-requests/new']}>
      <Routes>
        <Route path="/trial-cohabitation-requests/new" element={<TrialCohabitationRequestPage />} />
        <Route path="/trial-cohabitation-requests" element={<p>Mis solicitudes</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const textbox = (name) => screen.getByRole('textbox', { name })
const startField = () => screen.getByLabelText(/^Fecha de inicio/)
const endField = () => screen.getByLabelText(/^Fecha de fin/)
const submit = (user) => user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

async function fillForm(user, { pet = '1', start, end, description = 'Quiero convivir con Luna' }) {
  await user.selectOptions(combobox('Mascota'), pet)
  fireEvent.change(startField(), { target: { value: start } })
  fireEvent.change(endField(), { target: { value: end } })
  await user.type(textbox('Descripción'), description)
}

describe('TrialCohabitationRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 7 })
    getPets.mockResolvedValue(PETS)
    createTrialCohabitationRequest.mockImplementation(async (request) => ({
      id: 5,
      ...request,
    }))
  })

  it('only lets an adopter send the request', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1 })
    renderPage()

    expect(
      screen.getByText('Solo los adoptantes pueden solicitar una convivencia de prueba.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).not.toBeInTheDocument()
    expect(getPets).not.toHaveBeenCalled()
  })

  it('offers only the active pets', async () => {
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    expect(screen.getByRole('option', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Kiara — Perro' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Michi — Gato' })).not.toBeInTheDocument()
  })

  it('explains when there are no active pets', async () => {
    getPets.mockResolvedValue([PETS[1]])
    renderPage()

    expect(
      await screen.findByText('No hay mascotas activas disponibles para convivencia de prueba.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).not.toBeInTheDocument()
  })

  it('shows the duration of the period while it is complete', async () => {
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    fireEvent.change(startField(), { target: { value: daysFromToday(7) } })
    fireEvent.change(endField(), { target: { value: daysFromToday(10) } })

    expect(screen.getByText('Duración: 4 días')).toBeInTheDocument()
  })

  it('asks for every required field before calling the back-end', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await submit(user)

    expect(screen.getByText(PET_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(screen.getAllByText(REQUIRED_MESSAGE)).toHaveLength(3)
    expect(createTrialCohabitationRequest).not.toHaveBeenCalled()
  })

  it('rejects a start date before today', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, { start: daysFromToday(-1), end: daysFromToday(3) })
    await submit(user)

    expect(await screen.findByText(START_IN_PAST_MESSAGE)).toBeInTheDocument()
    expect(createTrialCohabitationRequest).not.toHaveBeenCalled()
  })

  it('rejects an end date before the start date', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, { start: daysFromToday(7), end: daysFromToday(3) })
    await submit(user)

    expect(await screen.findByText(END_BEFORE_START_MESSAGE)).toBeInTheDocument()
    expect(createTrialCohabitationRequest).not.toHaveBeenCalled()
  })

  it('sends the request with the adopter, the shelter of the pet and the period', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, {
      start: daysFromToday(7),
      end: daysFromToday(10),
      description: '  Quiero convivir con Luna  ',
    })
    await submit(user)

    await waitFor(() =>
      expect(createTrialCohabitationRequest).toHaveBeenCalledWith({
        date: dayStartISO(todayISO()),
        status: 'PENDING',
        description: 'Quiero convivir con Luna',
        startDate: dayStartISO(daysFromToday(7)),
        endDate: dayStartISO(daysFromToday(10)),
        shelter: { id: 1 },
        adopter: { id: 7 },
        pet: { id: 1 },
      }),
    )

    const dialog = await screen.findByRole('dialog', {
      name: '¡Solicitud de convivencia enviada con éxito!',
    })
    expect(dialog).toHaveTextContent('Código HTTP 201 • Creado con éxito')
    expect(dialog).toHaveTextContent('Refugio Patitas')
    expect(within(dialog).getByText('Duración').parentElement).toHaveTextContent('4 días')
    expect(within(dialog).getByText('Estado').parentElement).toHaveTextContent('Pendiente')
  })

  it('lets the adopter send another request after a success', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, { start: daysFromToday(7), end: daysFromToday(10) })
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Enviar otra solicitud' }))

    expect(combobox('Mascota')).toHaveValue('')
    expect(startField()).toHaveValue('')
    expect(textbox('Descripción')).toHaveValue('')
  })

  it('marks the end date when the back-end rejects the period', async () => {
    const user = userEvent.setup()
    createTrialCohabitationRequest.mockRejectedValue(
      new ApiError('The end date cannot be earlier than the start date', 412),
    )
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, { start: daysFromToday(7), end: daysFromToday(10) })
    await submit(user)

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Error al enviar la solicitud',
    })
    expect(within(dialog).getByText('The end date cannot be earlier than the start date')).toBeInTheDocument()
    expect(endField()).toHaveAttribute('aria-invalid', 'true')
  })

  it('marks the pet when the back-end says it is not available', async () => {
    const user = userEvent.setup()
    createTrialCohabitationRequest.mockRejectedValue(
      new ApiError('The pet is not available for trial cohabitation', 412),
    )
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user, { start: daysFromToday(7), end: daysFromToday(10) })
    await submit(user)

    expect(
      await screen.findByRole('alertdialog', { name: 'Error al enviar la solicitud' }),
    ).toBeInTheDocument()
    expect(combobox('Mascota')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows the pets that could not be loaded and lets the user retry', async () => {
    const user = userEvent.setup()
    getPets.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('combobox', { name: 'Mascota' })).toBeInTheDocument()
    expect(getPets).toHaveBeenCalledTimes(2)
  })
})
