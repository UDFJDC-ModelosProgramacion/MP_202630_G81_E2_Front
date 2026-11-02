import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdopterRegisterPage from './AdopterRegisterPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import { createAdopter } from '../../services/adopterService'

vi.mock('../../services/adopterService', () => ({ createAdopter: vi.fn() }))
vi.mock('../../config/session', () => ({
  ROLES: {
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
  getSession: vi.fn(),
}))

function PetsStub() {
  return <p>Búsqueda de mascotas</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adopters/new']}>
      <Routes>
        <Route path="/adopters/new" element={<AdopterRegisterPage />} />
        <Route path="/pets" element={<PetsStub />} />
        <Route path="/" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const control = (name) => screen.getByLabelText(name, { exact: false })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrarme' }))

async function fillForm(user) {
  await user.type(control('Nombres'), 'María Fernanda')
  await user.type(control('Apellidos'), 'Gómez Ruiz')
  await user.type(control('Cédula'), '1020304050')
  await user.type(control('Correo electrónico'), 'maria@example.com')
  await user.type(control('Contraseña'), 'secret123')
  await user.type(control('Teléfono'), '3001234567')
  await user.type(control('Dirección'), 'Calle 45 # 20-30')
  await user.selectOptions(control('Tipo de vivienda'), 'Casa')
  await user.selectOptions(control('¿Hay niños en casa?'), 'true')
  await user.selectOptions(control('¿Hay otras mascotas en casa?'), 'false')
  await user.type(control('Ocupación'), 'Ingeniera')
  await user.type(control('Ingresos mensuales'), '3500000')
  await user.type(control('Alergias'), 'Ninguna')
}

describe('AdopterRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'VISITOR', userId: 0, name: 'Visitante' })
  })

  it('asks for every adopter field, all marked as required', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Regístrese como Adoptante' })).toBeInTheDocument()
    ;[
      'Nombres',
      'Apellidos',
      'Cédula',
      'Correo electrónico',
      'Contraseña',
      'Teléfono',
      'Dirección',
      'Tipo de vivienda',
      '¿Hay niños en casa?',
      '¿Hay otras mascotas en casa?',
      'Ocupación',
      'Ingresos mensuales',
      'Alergias',
    ].forEach((name) => expect(control(name)).toHaveAttribute('aria-required', 'true'))
    expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
  })

  it('offers the fixed housing types so they match the pet search filters', () => {
    renderPage()

    const options = [...control('Tipo de vivienda').options].map((option) => option.value)

    expect(options).toEqual(['', 'Casa', 'Apartamento'])
  })

  it('explains that only visitors can register as adopters', () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo los visitantes pueden registrarse como adoptantes.',
    )
    expect(screen.queryByRole('button', { name: 'Registrarme' })).not.toBeInTheDocument()
  })

  it('validates on the client, focuses the first error and does not call the backend', async () => {
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(createAdopter).not.toHaveBeenCalled()
    expect(control('Nombres')).toHaveAccessibleDescription('Este campo es obligatorio.')
    expect(control('Nombres')).toHaveFocus()
    expect(control('Alergias')).toHaveAccessibleDescription('Este campo es obligatorio.')
  })

  it('rejects an income that is not a positive number', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillForm(user)
    await user.clear(control('Ingresos mensuales'))
    await user.type(control('Ingresos mensuales'), '0')

    await submit(user)

    expect(createAdopter).not.toHaveBeenCalled()
    expect(control('Ingresos mensuales')).toHaveAccessibleDescription(
      'Ingrese un valor numérico mayor que cero.',
    )
  })

  it('registers the adopter, shows the confirmation and goes to the pet search', async () => {
    const user = userEvent.setup()
    createAdopter.mockResolvedValue({ id: 9 })
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(createAdopter).toHaveBeenCalledWith({
      firstName: 'María Fernanda',
      lastName: 'Gómez Ruiz',
      email: 'maria@example.com',
      password: 'secret123',
      phone: '3001234567',
      address: 'Calle 45 # 20-30',
      nationalId: '1020304050',
      occupation: 'Ingeniera',
      earnings: 3500000,
      allergies: 'Ninguna',
      housingType: 'Casa',
      hasChildren: true,
      hasOtherPets: false,
    })
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Su perfil de adoptante "María Fernanda Gómez Ruiz" ha sido creado satisfactoriamente.',
    )

    await user.click(screen.getByRole('button', { name: 'Buscar mascotas' }))

    expect(screen.getByText('Búsqueda de mascotas')).toBeInTheDocument()
  })

  it('shows the backend message on the email field when the email is already registered', async () => {
    const user = userEvent.setup()
    const message =
      'The user associated with this adopter already exists; this email is already registered'
    createAdopter.mockRejectedValue(new ApiError(message, 412))
    renderPage()
    await fillForm(user)

    await submit(user)

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(message)
    expect(control('Correo electrónico')).toHaveAccessibleDescription(message)
    expect(control('Nombres')).toHaveValue('María Fernanda')
  })
})
