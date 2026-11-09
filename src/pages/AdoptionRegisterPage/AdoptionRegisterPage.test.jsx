import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdoptionRegisterPage from './AdoptionRegisterPage'
import { REQUEST_REQUIRED_MESSAGE, REQUIRED_MESSAGE } from './adoptionForm'
import { getSession } from '../../config/roleSession'
import { getAdoptionRequests } from '../../services/adoptionRequestService'
import { createAdoption } from '../../services/adoptionService'
import { ApiError } from '../../services/apiClient'
import { getPets } from '../../services/petService'
import { dayStartISO } from '../../utils/dates'

vi.mock('../../services/adoptionService', () => ({ createAdoption: vi.fn() }))
vi.mock('../../services/adoptionRequestService', () => ({ getAdoptionRequests: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const PETS = [
  { id: 1, name: 'Luna', species: 'Perro', active: true, shelter: { id: 1 }, adoptions: [] },
  { id: 2, name: 'Michi', species: 'Gato', active: true, shelter: { id: 2 }, adoptions: [] },
  {
    id: 3,
    name: 'Kiara',
    species: 'Perro',
    shelter: { id: 1 },
    adoptions: [{ id: 9, status: 'CANCELLED' }],
  },
  {
    id: 4,
    name: 'Nala',
    species: 'Gato',
    active: true,
    shelter: { id: 1 },
    adoptions: [{ id: 8, status: 'IN_PROGRESS' }],
  },
]

const CARLOS = { id: 2, firstName: 'Carlos', lastName: 'Perez', active: true }
const ANA = { id: 3, firstName: 'Ana', lastName: 'Gomez', active: false }
const LUIS = { id: 4, firstName: 'Luis', lastName: 'Diaz', active: true }

const REQUESTS = [
  { id: 11, status: 'APPROVED', adoption: null, pet: PETS[0], adopter: CARLOS },
  { id: 12, status: 'APPROVED', adoption: null, pet: PETS[2], adopter: ANA },
  { id: 13, status: 'APPROVED', adoption: { id: 5 }, pet: PETS[2], adopter: LUIS },
  { id: 14, status: 'APPROVED', adoption: null, pet: PETS[1], adopter: LUIS },
  { id: 15, status: 'APPROVED', adoption: null, pet: PETS[3], adopter: LUIS },
  { id: 16, status: 'REJECTED', adoption: null, pet: PETS[2], adopter: LUIS },
]

// Applies the filters the way the back-end does for the same request.
function fakeBackend({ petId, status }) {
  return REQUESTS.filter(
    (request) => String(request.pet.id) === String(petId) && request.status === status,
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adoptions/new']}>
      <Routes>
        <Route path="/adoptions/new" element={<AdoptionRegisterPage />} />
        <Route path="/pets/:petId" element={<p>Perfil de la mascota</p>} />
        <Route path="/pets" element={<p>Mascotas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const textbox = (name) => screen.getByRole('textbox', { name })
const dateField = () => screen.getByLabelText(/^Fecha de la adopción/)
const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar adopción' }))

async function fillForm(user, { request = '11', date = '2026-11-04', notes = 'Revisar vacunas cada mes' }) {
  await user.selectOptions(combobox('Solicitud aprobada'), request)
  fireEvent.change(dateField(), { target: { value: date } })
  await user.type(textbox('Notas importantes'), notes)
}

describe('AdoptionRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    getPets.mockResolvedValue(PETS)
    getAdoptionRequests.mockImplementation(async (filters) => fakeBackend(filters))
    createAdoption.mockResolvedValue({ id: 7, date: '2026-11-04T05:00:00.000+00:00' })
  })

  it('only lets the shelter staff register an adoption', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede registrar adopciones.'),
    ).toBeInTheDocument()
    expect(getPets).not.toHaveBeenCalled()
  })

  it('offers only the approved requests of the shelter pets that are available', async () => {
    renderPage()

    expect(await screen.findByRole('option', { name: 'Luna — Carlos Perez' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Kiara — Ana Gomez' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Kiara — Luis Diaz' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Michi — Luis Diaz' })).not.toBeInTheDocument()
  })

  it('only queries the pets of the shelter that are still available', async () => {
    renderPage()
    await screen.findByRole('option', { name: 'Luna — Carlos Perez' })

    expect(getAdoptionRequests).not.toHaveBeenCalledWith(expect.objectContaining({ petId: 2 }))
    expect(getAdoptionRequests).not.toHaveBeenCalledWith(expect.objectContaining({ petId: 4 }))
    expect(getAdoptionRequests).toHaveBeenCalledWith({
      petId: 1,
      status: 'APPROVED',
      currentUserRole: 'ADMIN',
    })
  })

  it('registers the adoption from the approved request and shows the confirmation', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('option', { name: 'Luna — Carlos Perez' })

    await fillForm(user, { notes: '  Revisar vacunas cada mes  ' })
    await submit(user)

    await waitFor(() =>
      expect(createAdoption).toHaveBeenCalledWith({
        date: dayStartISO('2026-11-04'),
        status: 'IN_PROGRESS',
        importantNotes: 'Revisar vacunas cada mes',
        pet: { id: 1 },
        shelter: { id: 1 },
        adopter: { id: 2 },
        adoptionRequest: { id: 11 },
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: '¡Adopción registrada con éxito!' })
    expect(dialog).toHaveTextContent('Código HTTP 201 • Creado con éxito')
    expect(within(dialog).getByText('En curso')).toBeInTheDocument()
    expect(within(dialog).getByText('Carlos Perez')).toBeInTheDocument()
  })

  it('asks for every required field before calling the back-end', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('option', { name: 'Luna — Carlos Perez' })

    await submit(user)

    expect(screen.getByText(REQUEST_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(screen.getAllByText(REQUIRED_MESSAGE)).toHaveLength(2)
    expect(createAdoption).not.toHaveBeenCalled()
  })

  it('marks the request when the back-end refuses the adoption', async () => {
    const user = userEvent.setup()
    createAdoption.mockRejectedValue(new ApiError('An adoption already exists for this pet', 412))
    renderPage()
    await screen.findByRole('option', { name: 'Luna — Carlos Perez' })

    await fillForm(user, {})
    await submit(user)

    const dialog = await screen.findByRole('alertdialog', { name: 'Error al registrar la adopción' })
    expect(within(dialog).getByText('An adoption already exists for this pet')).toBeInTheDocument()
    expect(combobox('Solicitud aprobada')).toHaveAttribute('aria-invalid', 'true')
  })

  it('reloads the available requests after a registration so the used one disappears', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('option', { name: 'Luna — Carlos Perez' })

    await fillForm(user, {})
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Registrar otra adopción' }))

    await waitFor(() => expect(getPets).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('combobox', { name: 'Solicitud aprobada' })).toHaveValue('')
    expect(textbox('Notas importantes')).toHaveValue('')
  })

  it('explains when the shelter has no pets', async () => {
    getPets.mockResolvedValue([PETS[1]])
    renderPage()

    expect(await screen.findByText('Tu refugio aún no tiene mascotas registradas.')).toBeInTheDocument()
    expect(getAdoptionRequests).not.toHaveBeenCalled()
  })

  it('explains when every pet of the shelter is already adopted', async () => {
    getPets.mockResolvedValue([PETS[3]])
    renderPage()

    expect(
      await screen.findByText('No hay mascotas disponibles para adopción en tu refugio.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Tu refugio aún no tiene mascotas registradas.')).not.toBeInTheDocument()
    expect(getAdoptionRequests).not.toHaveBeenCalled()
  })

  it('explains when there are no approved requests to use', async () => {
    getAdoptionRequests.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText(
        'No hay solicitudes de adopción aprobadas disponibles para registrar una adopción.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the error when the pets cannot be loaded and lets the user retry', async () => {
    const user = userEvent.setup()
    getPets.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('combobox', { name: 'Solicitud aprobada' })).toBeInTheDocument()
  })
})
