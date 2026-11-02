import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdopterEditPage from './AdopterEditPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { deleteAdopter, getAdopter, updateAdopter } from '../../services/adopterService'

vi.mock('../../services/adopterService', () => ({
  deleteAdopter: vi.fn(),
  getAdopter: vi.fn(),
  updateAdopter: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const adopter = {
  id: 7,
  firstName: 'Ana',
  lastName: 'Gómez',
  nationalId: '1001',
  email: 'ana@example.com',
  phone: '3001234567',
  address: 'Calle 10 #5-20',
  occupation: 'Ingeniera',
  earnings: 4500000,
  housingType: 'Casa',
  allergies: 'Ninguna',
  hasChildren: false,
  hasOtherPets: true,
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adopters/7/edit']}>
      <Routes>
        <Route path="/adopters/:adopterId/edit" element={<AdopterEditPage />} />
        <Route path="/" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const control = (name) => screen.getByLabelText(name, { exact: false })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 7 })
  vi.mocked(deleteAdopter).mockReset()
  vi.mocked(getAdopter).mockReset()
  vi.mocked(updateAdopter).mockReset()
  vi.mocked(getAdopter).mockResolvedValue(adopter)
  vi.mocked(updateAdopter).mockImplementation((id, payload) =>
    Promise.resolve({ ...adopter, ...payload }),
  )
})

describe('AdopterEditPage', () => {
  it('prefills the editable fields and shows the identity data as read-only', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('Calle 10 #5-20')).toBeInTheDocument()
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
    expect(screen.getByText('1001')).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(control('Ocupación')).toHaveValue('Ingeniera')
    expect(control('Ingresos mensuales')).toHaveValue(4500000)
    expect(control('Tipo de vivienda')).toHaveValue('Casa')
    expect(control('¿Hay niños en casa?')).toHaveValue('false')
    expect(control('¿Hay otras mascotas en casa?')).toHaveValue('true')
    expect(getAdopter).toHaveBeenCalledWith('7')
  })

  it('blocks the submit when a required field is empty', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('Calle 10 #5-20')

    await user.clear(control('Dirección'))
    await submit(user)

    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(updateAdopter).not.toHaveBeenCalled()
  })

  it('saves only the updatable fields and confirms with the updated profile', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('Calle 10 #5-20')

    await user.clear(control('Ocupación'))
    await user.type(control('Ocupación'), 'Arquitecta')
    await user.selectOptions(control('Tipo de vivienda'), 'Apartamento')
    await submit(user)

    expect(updateAdopter).toHaveBeenCalledWith(7, {
      address: 'Calle 10 #5-20',
      occupation: 'Arquitecta',
      earnings: 4500000,
      allergies: 'Ninguna',
      housingType: 'Apartamento',
      hasChildren: false,
      hasOtherPets: true,
    })
    expect(
      await screen.findByText('Los datos de Ana Gómez se guardaron correctamente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Apartamento')
  })

  it('shows the backend message next to the field when the update is rejected', async () => {
    const user = userEvent.setup()
    vi.mocked(updateAdopter).mockRejectedValue(
      new ApiError('Address cannot be null or empty', 412),
    )
    renderPage()
    await screen.findByDisplayValue('Calle 10 #5-20')

    await submit(user)

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Address cannot be null or empty')).toBeInTheDocument()
    expect(document.getElementById('address-error')).toHaveTextContent(
      'Address cannot be null or empty',
    )
  })

  it('shows the error when the adopter does not exist', async () => {
    vi.mocked(getAdopter).mockRejectedValue(new ApiError('Adopter not found', 404))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Adopter not found')
  })

  it('blocks roles other than the adopter', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN', userId: 7 })
    renderPage()

    expect(screen.getByText('Solo el adoptante puede editar su perfil.')).toBeInTheDocument()
    expect(getAdopter).not.toHaveBeenCalled()
  })

  it('asks for confirmation and deletes the account, then returns home', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteAdopter).mockResolvedValue(null)
    renderPage()
    await screen.findByDisplayValue('Calle 10 #5-20')

    await user.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    const confirm = screen.getByRole('alertdialog')
    expect(confirm).toHaveTextContent('Ana Gómez')
    expect(confirm).toHaveTextContent('Esta acción no se puede deshacer')

    await user.click(within(confirm).getByRole('button', { name: 'Sí, eliminar mi cuenta' }))

    expect(deleteAdopter).toHaveBeenCalledWith(7)
    expect(await screen.findByText('Cuenta eliminada')).toBeInTheDocument()
    expect(screen.getByText('Sesión cerrada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('explains why the account cannot be deleted', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteAdopter).mockRejectedValue(
      new ApiError(
        'An adopter with approved or in-progress adoption requests cannot be deleted; deactivate it instead',
        412,
      ),
    )
    renderPage()
    await screen.findByDisplayValue('Calle 10 #5-20')

    await user.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('cannot be deleted; deactivate it instead')
    expect(dialog).toHaveTextContent('desactive su cuenta en lugar de eliminarla')
    expect(control('Dirección')).toBeInTheDocument()
  })

  it('blocks editing another adopter profile', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 8 })
    renderPage()

    expect(screen.getByText('Solo puede editar su propio perfil.')).toBeInTheDocument()
    expect(getAdopter).not.toHaveBeenCalled()
  })
})
