import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MedicalEventRegisterPage from './MedicalEventRegisterPage'
import { getSession } from '../../config/session'
import { ApiError } from '../../services/apiClient'
import { createMedicalEvent } from '../../services/medicalEventService'
import { getPets } from '../../services/petService'
import { getVeterinarians } from '../../services/veterinarianService'
import { FUTURE_DATE_MESSAGE, PET_REQUIRED_MESSAGE } from './medicalEventForm'
import { dayStartISO, todayISO } from '../../utils/dates'

vi.mock('../../services/medicalEventService', () => ({ createMedicalEvent: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../services/veterinarianService', () => ({ getVeterinarians: vi.fn() }))
vi.mock('../../config/session', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', active: true },
  { id: 2, name: 'Michi', species: 'Gato', active: false },
]

const VETERINARIANS = [
  { id: 5, firstName: 'Ana', lastName: 'Ruiz', specialization: 'Cirugia', active: true },
]

function PetProfileStub() {
  return <p>Perfil de la mascota</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/medical-events/new']}>
      <Routes>
        <Route path="/medical-events/new" element={<MedicalEventRegisterPage />} />
        <Route path="/pets/:petId" element={<PetProfileStub />} />
        <Route path="/veterinarians" element={<p>Listado de veterinarios</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const textbox = (name) => screen.getByRole('textbox', { name })
const combobox = (name) => screen.getByRole('combobox', { name })
const dateField = () => screen.getByLabelText(/^Fecha del evento/)
const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar evento' }))

async function fillForm(user) {
  await user.selectOptions(combobox('Mascota'), '1')
  await user.selectOptions(combobox('Veterinario'), '5')
  fireEvent.change(dateField(), { target: { value: '2020-01-01' } })
  await user.selectOptions(combobox('Tipo de evento'), 'Cirugia')
  await user.type(textbox('Descripción'), 'Esterilización sin complicaciones')
}

describe('MedicalEventRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })
    getPets.mockResolvedValue(PETS)
    getVeterinarians.mockResolvedValue(VETERINARIANS)
    createMedicalEvent.mockResolvedValue({ id: 10, pet: { id: 1 }, date: '2020-01-01' })
  })

  it('shows the form with its mandatory fields marked', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Registrar evento médico' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: 'Mascota' })).toHaveAttribute(
      'aria-required',
      'true',
    )
    expect(combobox('Tipo de evento')).toHaveAttribute('aria-required', 'true')
    expect(dateField()).toHaveAttribute('max', todayISO())
    expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
  })

  it('offers only the active pets and the registered veterinarians', async () => {
    renderPage()

    const pets = await screen.findAllByRole('option')
    expect(pets.map((option) => option.textContent)).toContain('Luna — Perro')
    expect(pets.map((option) => option.textContent)).not.toContain('Michi — Gato')
    expect(within(combobox('Veterinario')).getByRole('option', { name: 'Dr(a). Ana Ruiz — Cirugia' })).toBeInTheDocument()
  })

  it('shows the required errors and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await submit(user)

    expect(screen.getByText(PET_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(combobox('Mascota')).toHaveFocus()
    expect(createMedicalEvent).not.toHaveBeenCalled()
  })

  it('rejects a date in the future', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await user.selectOptions(combobox('Mascota'), '1')
    await user.selectOptions(combobox('Veterinario'), '5')
    await user.selectOptions(combobox('Tipo de evento'), 'Cirugia')
    await user.type(textbox('Descripción'), 'Esterilización sin complicaciones')
    fireEvent.change(dateField(), { target: { value: '2999-01-01' } })
    await submit(user)

    expect(screen.getByText(FUTURE_DATE_MESSAGE)).toBeInTheDocument()
    expect(dateField()).toHaveFocus()
    expect(createMedicalEvent).not.toHaveBeenCalled()
  })

  it('sends the event to the backend and shows the confirmation', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user)
    await submit(user)

    await waitFor(() =>
      expect(createMedicalEvent).toHaveBeenCalledWith({
        date: dayStartISO('2020-01-01'),
        type: 'Cirugia',
        description: 'Esterilización sin complicaciones',
        pet: { id: 1 },
        veterinarian: { id: 5 },
      }),
    )
    expect(await screen.findByText('¡Evento médico registrado con éxito!')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver la mascota' }))

    expect(screen.getByText('Perfil de la mascota')).toBeInTheDocument()
  })

  it('shows the backend message in a dialog and next to the matching field', async () => {
    const user = userEvent.setup()
    createMedicalEvent.mockRejectedValue(new ApiError('The pet is not active in the system', 412))
    renderPage()
    await screen.findByRole('combobox', { name: 'Mascota' })

    await fillForm(user)
    await submit(user)

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Error al registrar el evento médico',
    })
    expect(within(dialog).getByText('The pet is not active in the system')).toBeInTheDocument()
    expect(within(dialog).getByText('Error 412 • Conflicto de registro')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Modificar datos' }))

    await waitFor(() => expect(combobox('Mascota')).toHaveFocus())
    expect(screen.getByText('The pet is not active in the system')).toBeInTheDocument()
  })

  it('shows a retry option when the pet or veterinarian lists cannot be loaded', async () => {
    getPets.mockRejectedValue(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('explains what is missing when there are no active pets', async () => {
    getPets.mockResolvedValue([{ id: 2, name: 'Michi', species: 'Gato', active: false }])
    renderPage()

    expect(
      await screen.findByText(
        'No hay mascotas activas registradas: registra una mascota antes de crear un evento médico.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )
  })

  it('does not allow roles outside the shelter staff', () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede registrar eventos médicos.'),
    ).toBeInTheDocument()
    expect(getPets).not.toHaveBeenCalled()
  })
})
