import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FollowUpRegisterPage from './FollowUpRegisterPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { createFollowUp } from '../../services/followUpService'

vi.mock('../../services/followUpService', () => ({ createFollowUp: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN' },
  getSession: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adoptions/1/followUps/new']}>
      <Routes>
        <Route path="/adoptions/:adoptionId/followUps/new" element={<FollowUpRegisterPage />} />
        <Route path="/adoptions/:adoptionId/followUps" element={<p>Lista de seguimientos</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const control = (name) => screen.getByLabelText(name, { exact: false })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar seguimiento' }))

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'VETERINARIAN', userId: 1 })
  vi.mocked(createFollowUp).mockReset()
  vi.mocked(createFollowUp).mockResolvedValue({
    id: 9,
    date: '2030-01-15T23:59:59',
    observation: 'Buena adaptación',
  })
})

describe('FollowUpRegisterPage', () => {
  it('registers a follow-up and confirms it', async () => {
    const user = userEvent.setup()
    renderPage()

    fireEvent.change(control('Fecha'), { target: { value: '2030-01-15' } })
    await user.type(control('Observación'), 'Buena adaptación')
    await submit(user)

    expect(createFollowUp).toHaveBeenCalledWith('1', {
      date: '2030-01-15T23:59:59',
      observation: 'Buena adaptación',
      veterinarian: { id: 1 },
      adoption: { id: 1 },
    })
    expect(await screen.findByText('¡Seguimiento registrado!')).toBeInTheDocument()
    expect(screen.getByText(/15 ene 2030/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver seguimientos' }))
    expect(screen.getByText('Lista de seguimientos')).toBeInTheDocument()
  })

  it('requires the observation before sending', async () => {
    const user = userEvent.setup()
    renderPage()

    fireEvent.change(control('Fecha'), { target: { value: '2030-01-15' } })
    await submit(user)

    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(createFollowUp).not.toHaveBeenCalled()
  })

  it('rejects a past date on the client', async () => {
    const user = userEvent.setup()
    renderPage()

    fireEvent.change(control('Fecha'), { target: { value: '2020-01-01' } })
    await user.type(control('Observación'), 'Buena adaptación')
    await submit(user)

    expect(
      await screen.findByText('La fecha no puede ser anterior a hoy.'),
    ).toBeInTheDocument()
    expect(createFollowUp).not.toHaveBeenCalled()
  })

  it('shows the backend message next to the field when it is rejected', async () => {
    const user = userEvent.setup()
    vi.mocked(createFollowUp).mockRejectedValue(
      new ApiError('Observation cannot be null or empty', 412),
    )
    renderPage()

    fireEvent.change(control('Fecha'), { target: { value: '2030-01-15' } })
    await user.type(control('Observación'), 'Buena adaptación')
    await submit(user)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Observation cannot be null or empty')
    expect(document.getElementById('observation-error')).toHaveTextContent(
      'Observation cannot be null or empty',
    )
  })

  it('explains when the adoption is not finalized', async () => {
    const user = userEvent.setup()
    vi.mocked(createFollowUp).mockRejectedValue(
      new ApiError('The associated adoption must be in finalized status', 412),
    )
    renderPage()

    fireEvent.change(control('Fecha'), { target: { value: '2030-01-15' } })
    await user.type(control('Observación'), 'Buena adaptación')
    await submit(user)

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'The associated adoption must be in finalized status',
    )
    expect(document.getElementById('observation-error')).toBeNull()
  })

  it('blocks roles other than the veterinarian', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1 })
    renderPage()

    expect(
      screen.getByText('Solo el veterinario asignado a la adopción puede registrar seguimientos.'),
    ).toBeInTheDocument()
    expect(createFollowUp).not.toHaveBeenCalled()
  })
})
