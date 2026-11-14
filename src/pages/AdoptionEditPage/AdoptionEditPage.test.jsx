import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdoptionEditPage from './AdoptionEditPage'
import { REQUIRED_MESSAGE } from './adoptionEditForm'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import { getAdoption, updateAdoption } from '../../services/adoptionService'
import { dayStartISO } from '../../utils/dates'

vi.mock('../../services/adoptionService', () => ({
  getAdoption: vi.fn(),
  updateAdoption: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const ADOPTION = {
  id: 1,
  date: '2026-11-08',
  status: 'IN_PROGRESS',
  importantNotes: 'Revisar vacunas cada mes',
  pet: { id: 1, name: 'Luna', species: 'Perro', shelter: { id: 1 } },
  shelter: { id: 1 },
  adopter: { id: 2, firstName: 'Carlos', lastName: 'Perez' },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adoptions/1/edit']}>
      <Routes>
        <Route path="/adoptions/:adoptionId/edit" element={<AdoptionEditPage />} />
        <Route path="/adoptions/:adoptionId" element={<p>Detalle de la adopción</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const combobox = (name) => screen.getByRole('combobox', { name })
const textbox = (name) => screen.getByRole('textbox', { name })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

describe('AdoptionEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    getAdoption.mockResolvedValue(ADOPTION)
    updateAdoption.mockImplementation(async (id, body) => ({ ...ADOPTION, ...body }))
  })

  it('only lets the shelter staff edit an adoption', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    renderPage()

    expect(
      screen.getByText('Solo el personal del refugio puede editar adopciones.'),
    ).toBeInTheDocument()
    expect(getAdoption).not.toHaveBeenCalled()
  })

  it('prefills the form with the adoption and keeps the pet and the adopter fixed', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('2026-11-08')).toBeInTheDocument()
    expect(combobox('Estado de la adopción')).toHaveValue('IN_PROGRESS')
    expect(textbox('Notas importantes')).toHaveValue('Revisar vacunas cada mes')
    expect(screen.getByText('La mascota y el adoptante no se pueden cambiar.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Mascota' })).not.toBeInTheDocument()
  })

  it('does not allow editing a finalized or cancelled adoption', async () => {
    getAdoption.mockResolvedValue({ ...ADOPTION, status: 'FINALIZED' })
    renderPage()

    expect(
      await screen.findByText('Una adopción finalizada o cancelada no se puede modificar.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })

  it('denies the adoption to a shelter that does not own the pet', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 5, shelterId: 2 })
    renderPage()

    expect(await screen.findByText('No tienes acceso a esta adopción.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })

  it('asks for the required fields before calling the back-end', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('2026-11-08')

    fireEvent.change(textbox('Notas importantes'), { target: { value: '   ' } })
    await submit(user)

    expect(screen.getByText(REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(updateAdoption).not.toHaveBeenCalled()
  })

  it('saves the changes and shows the confirmation', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('2026-11-08')

    await user.selectOptions(combobox('Estado de la adopción'), 'FINALIZED')
    await user.clear(textbox('Notas importantes'))
    await user.type(textbox('Notas importantes'), '  Adopción cerrada sin novedades  ')
    await submit(user)

    await waitFor(() =>
      expect(updateAdoption).toHaveBeenCalledWith(1, {
        date: dayStartISO('2026-11-08'),
        status: 'FINALIZED',
        importantNotes: 'Adopción cerrada sin novedades',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: '¡Adopción actualizada con éxito!' })
    expect(dialog).toHaveTextContent('Código HTTP 200 • Actualizada con éxito')
    expect(within(dialog).getByText('Finalizada')).toBeInTheDocument()
  })

  it('marks the status when the back-end refuses the change', async () => {
    const user = userEvent.setup()
    updateAdoption.mockRejectedValue(
      new ApiError('A finalized or cancelled adoption cannot be modified', 412),
    )
    renderPage()
    await screen.findByDisplayValue('2026-11-08')

    await submit(user)

    const dialog = await screen.findByRole('alertdialog', { name: 'Error al actualizar la adopción' })
    expect(
      within(dialog).getByText('A finalized or cancelled adoption cannot be modified'),
    ).toBeInTheDocument()
    expect(combobox('Estado de la adopción')).toHaveAttribute('aria-invalid', 'true')
  })

  it('goes back to the detail without saving when the user cancels', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('2026-11-08')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(await screen.findByText('Detalle de la adopción')).toBeInTheDocument()
    expect(updateAdoption).not.toHaveBeenCalled()
  })

  it('shows the load error and lets the user retry', async () => {
    const user = userEvent.setup()
    getAdoption.mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', 0))
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByDisplayValue('2026-11-08')).toBeInTheDocument()
    expect(getAdoption).toHaveBeenCalledTimes(2)
  })
})
