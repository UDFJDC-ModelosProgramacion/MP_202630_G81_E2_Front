import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FollowUpEditPage from './FollowUpEditPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { getFollowUp, updateFollowUp } from '../../services/followUpService'

vi.mock('../../services/followUpService', () => ({
  getFollowUp: vi.fn(),
  updateFollowUp: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adoptions/1/followUps/5/edit']}>
      <Routes>
        <Route
          path="/adoptions/:adoptionId/followUps/:followUpId/edit"
          element={<FollowUpEditPage />}
        />
        <Route path="/adoptions/:adoptionId/followUps" element={<p>Lista de seguimientos</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const control = (name) => screen.getByLabelText(name, { exact: false })

const STORED = {
  id: 5,
  date: '2030-01-15T00:00:00.000+00:00',
  observation: 'Buena adaptación',
  veterinarian: { id: 1, firstName: 'Laura', lastName: 'Gómez' },
  adoption: { id: 1 },
}

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'VETERINARIAN', userId: 1 })
  vi.mocked(getFollowUp).mockReset()
  vi.mocked(updateFollowUp).mockReset()
  vi.mocked(getFollowUp).mockResolvedValue(STORED)
})

describe('FollowUpEditPage', () => {
  it('prefills the form with the date disabled', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('Buena adaptación')).toBeInTheDocument()
    const date = control('Fecha')
    expect(date).toBeDisabled()
    expect(date).toHaveValue('2030-01-15')
    expect(
      screen.getByText(
        'Si la fecha fue un error, elimine el seguimiento y regístrelo de nuevo con la fecha correcta.',
      ),
    ).toBeInTheDocument()
    expect(getFollowUp).toHaveBeenCalledWith('1', '5', { requesterId: 1, role: 'VETERINARIAN' })
  })

  it('saves the observation keeping the date', async () => {
    const user = userEvent.setup()
    vi.mocked(updateFollowUp).mockResolvedValue({ ...STORED, observation: 'Actualizada' })
    renderPage()

    const observation = await screen.findByLabelText('Observación', { exact: false })
    await user.clear(observation)
    await user.type(observation, 'Actualizada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(updateFollowUp).toHaveBeenCalledWith('1', 5, {
      date: '2030-01-15T23:59:59',
      observation: 'Actualizada',
    })
    expect(screen.getByRole('status')).toHaveTextContent('Seguimiento actualizado')
    expect(screen.getAllByText('Actualizada')).toHaveLength(2)
  })

  it('requires the observation before sending', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByDisplayValue('Buena adaptación')
    await user.clear(control('Observación'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(updateFollowUp).not.toHaveBeenCalled()
  })

  it('shows the backend message next to the field when it is rejected', async () => {
    const user = userEvent.setup()
    vi.mocked(updateFollowUp).mockRejectedValue(
      new ApiError('Observation cannot be null or empty', 412),
    )
    renderPage()

    await screen.findByDisplayValue('Buena adaptación')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Observation cannot be null or empty',
    )
    expect(document.getElementById('observation-error')).toHaveTextContent(
      'Observation cannot be null or empty',
    )
  })

  it('shows the backend message when the follow-up does not exist', async () => {
    vi.mocked(getFollowUp).mockRejectedValue(new ApiError('Follow-up not found', 404))
    renderPage()

    expect(await screen.findByText('Follow-up not found')).toBeInTheDocument()
    expect(screen.queryByLabelText('Observación', { exact: false })).toBeNull()
  })

  it('blocks roles other than the veterinarian', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1 })
    renderPage()

    expect(
      screen.getByText(
        'Solo el veterinario asignado a la adopción puede editar seguimientos.',
      ),
    ).toBeInTheDocument()
    expect(getFollowUp).not.toHaveBeenCalled()
  })
})
