import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ShelterRegisterPage from './ShelterRegisterPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import { createShelter } from '../../services/shelterService'

vi.mock('../../services/shelterService', () => ({ createShelter: vi.fn() }))
vi.mock('../../config/session', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

function ShelterDetailStub() {
  const { state } = useLocation()
  return <p>Detalle del refugio. {state?.notice}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/shelters/new']}>
      <Routes>
        <Route path="/shelters/new" element={<ShelterRegisterPage />} />
        <Route path="/shelters/:shelterId" element={<ShelterDetailStub />} />
        <Route path="/" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const textbox = (name) => screen.getByRole('textbox', { name })
const city = () => screen.getByRole('combobox', { name: 'Ciudad' })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar' }))

async function fillForm(user) {
  await user.type(textbox('Nombre del refugio'), 'Patitas Felices')
  await user.selectOptions(city(), 'Bogotá')
  await user.type(textbox('NIT'), '900.069.803-1')
  await user.type(textbox('Dirección'), 'Carrera 15 # 85 - 32')
}

const backendError = (message) => new ApiError(message, 412)

describe('ShelterRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 7, name: 'AdminUser' })
  })

  it('asks for name, city, NIT and location, all marked as required', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Registre su Refugio' })).toBeInTheDocument()
    ;[textbox('Nombre del refugio'), city(), textbox('NIT'), textbox('Dirección')].forEach(
      (control) => expect(control).toHaveAttribute('aria-required', 'true'),
    )
    expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
  })

  it('tells the user that they become the administrator of the shelter', () => {
    renderPage()

    expect(screen.getByText(/AdminUser/)).toHaveTextContent('queda como su administrador')
  })

  it('explains that only the shelter administrator can register shelters', () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo el administrador de un refugio puede registrar refugios.',
    )
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
  })

  it('validates on the client, focuses the first error and does not call the backend', async () => {
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(createShelter).not.toHaveBeenCalled()
    expect(textbox('Nombre del refugio')).toHaveAccessibleDescription('Este campo es obligatorio.')
    expect(textbox('Nombre del refugio')).toHaveFocus()
    expect(textbox('Dirección')).toHaveAccessibleDescription('Este campo es obligatorio.')
  })

  it('clears the error of a field as soon as it is corrected', async () => {
    const user = userEvent.setup()
    renderPage()
    await submit(user)

    await user.type(textbox('Nombre del refugio'), 'Patitas')

    expect(textbox('Nombre del refugio')).not.toHaveAccessibleDescription()
  })

  it('creates the shelter with the logged user as responsible and opens its detail', async () => {
    const user = userEvent.setup()
    createShelter.mockResolvedValue({ id: 5 })
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(await screen.findByText(/Detalle del refugio/)).toHaveTextContent(
      'Refugio "Patitas Felices" creado con éxito.',
    )
    expect(createShelter).toHaveBeenCalledWith({
      name: 'Patitas Felices',
      city: 'Bogotá',
      nit: '900.069.803-1',
      location: 'Carrera 15 # 85 - 32',
      users: [{ id: 7 }],
    })
  })

  it('shows a loading state and blocks the button while the shelter is being created', async () => {
    const user = userEvent.setup()
    createShelter.mockReturnValue(new Promise(() => {}))
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(await screen.findByRole('status')).toHaveTextContent('Registrando refugio...')
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })

  it.each([
    ['Name cannot be null or empty', 'Nombre del refugio'],
    ['Location cannot be null or empty', 'Dirección'],
    ['Nit cannot be null or empty', 'NIT'],
    ['The nit is already registered for another shelter', 'NIT'],
  ])('shows "%s" next to the field "%s"', async (message, label) => {
    const user = userEvent.setup()
    createShelter.mockRejectedValue(backendError(message))
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(await screen.findByRole('textbox', { name: label })).toHaveAccessibleDescription(
      message,
    )
    expect(screen.getByRole('textbox', { name: label })).toHaveFocus()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(textbox('Nombre del refugio')).toHaveValue('Patitas Felices')
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
  })

  it('shows the missing city next to the city field', async () => {
    const user = userEvent.setup()
    createShelter.mockRejectedValue(backendError('City cannot be null or empty'))
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(await screen.findByRole('combobox', { name: 'Ciudad' })).toHaveAccessibleDescription(
      'City cannot be null or empty',
    )
  })

  it('shows a shelter with the same name, city and location in the error dialog', async () => {
    const user = userEvent.setup()
    const message = 'A shelter already exists with the same name, city and location'
    createShelter.mockRejectedValue(backendError(message))
    renderPage()
    await fillForm(user)

    await submit(user)

    const dialog = await screen.findByRole('alertdialog', { name: 'Error al registrar el refugio' })
    expect(dialog).toHaveTextContent(message)
    expect(dialog).toHaveTextContent('Error 412')
    expect(textbox('Nombre del refugio')).toHaveValue('Patitas Felices')
  })

  it('lets the user close the dialog and fix the data', async () => {
    const user = userEvent.setup()
    createShelter.mockRejectedValue(backendError('A shelter already exists with the same name, city and location'))
    renderPage()
    await fillForm(user)
    await submit(user)

    await user.click(await screen.findByRole('button', { name: 'Modificar datos' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
  })

  it('reports a connection failure in the dialog without a status code', async () => {
    const user = userEvent.setup()
    createShelter.mockRejectedValue(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()
    await fillForm(user)

    await submit(user)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('No se pudo conectar con el servidor.')
    expect(dialog).not.toHaveTextContent('Error 0')
  })

  it('lets the user cancel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })
})