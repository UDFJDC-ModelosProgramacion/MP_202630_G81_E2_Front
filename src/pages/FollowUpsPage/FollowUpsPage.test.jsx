import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FollowUpsPage from './FollowUpsPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { deleteFollowUp, getFollowUps } from '../../services/followUpService'

vi.mock('../../services/followUpService', () => ({
  getFollowUps: vi.fn(),
  deleteFollowUp: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: {
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    VETERINARIAN: 'VETERINARIAN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
  getSession: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adoptions/1/followUps']}>
      <Routes>
        <Route path="/adoptions/:adoptionId/followUps" element={<FollowUpsPage />} />
        <Route path="/adoptions/:adoptionId/followUps/new" element={<p>Registro</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const FUTURE = '2030-01-15T00:00:00.000+00:00'
const PAST = '2020-01-01T00:00:00.000+00:00'

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'VETERINARIAN', userId: 1 })
  vi.mocked(getFollowUps).mockReset()
  vi.mocked(deleteFollowUp).mockReset()
  vi.mocked(deleteFollowUp).mockResolvedValue(null)
})

describe('FollowUpsPage', () => {
  it('lists the follow-ups by date descending with their status', async () => {
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 1, date: PAST, observation: 'Seguimiento cerrado', veterinarian: null, adoption: { id: 1 } },
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    expect(await screen.findByText('Seguimiento del 15 ene 2030')).toBeInTheDocument()
    expect(screen.getByText('Próximo')).toBeInTheDocument()
    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(screen.getByText('Seguimiento del 1 ene 2020')).toBeInTheDocument()
    expect(getFollowUps).toHaveBeenCalledWith('1')
  })

  it('offers the registration action to the veterinarian', () => {
    vi.mocked(getFollowUps).mockResolvedValue([])
    renderPage()

    expect(screen.getByRole('link', { name: 'Registrar seguimiento' })).toHaveAttribute(
      'href',
      '/adoptions/1/followUps/new',
    )
  })

  it('offers the edit action on each card to the veterinarian', async () => {
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    expect(await screen.findByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/adoptions/1/followUps/2/edit',
    )
  })

  it('enables delete only for future dates', async () => {
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 1, date: PAST, observation: 'Seguimiento cerrado', veterinarian: null, adoption: { id: 1 } },
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    const buttons = await screen.findAllByRole('button', { name: 'Eliminar' })
    expect(buttons[0]).toBeEnabled()
    expect(buttons[1]).toBeDisabled()
    expect(buttons[1]).toHaveAttribute(
      'title',
      'Los seguimientos con fecha vencida preservan el historial del refugio y no se pueden eliminar.',
    )
  })

  it('deletes a follow-up after confirmation and removes it from the list', async () => {
    const user = userEvent.setup()
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    await screen.findByText('Seguimiento de control')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('¿Seguro que desea eliminar el seguimiento del 15 ene 2030?')
    expect(dialog).toHaveTextContent('Esta acción no se puede deshacer.')

    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(deleteFollowUp).toHaveBeenCalledWith('1', 2)
    expect(await screen.findByText('El seguimiento del 15 ene 2030 fue eliminado.')).toBeInTheDocument()
    expect(screen.queryByText('Seguimiento de control')).toBeNull()
  })

  it('keeps the follow-up when the deletion is cancelled', async () => {
    const user = userEvent.setup()
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    await screen.findByText('Seguimiento de control')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Seguimiento de control')).toBeInTheDocument()
    expect(deleteFollowUp).not.toHaveBeenCalled()
  })

  it('shows the backend message when the deletion is rejected', async () => {
    const user = userEvent.setup()
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    vi.mocked(deleteFollowUp).mockRejectedValue(
      new ApiError(
        'A follow-up that has already been closed or validated cannot be deleted; it preserves the shelter history',
        412,
      ),
    )
    renderPage()

    await screen.findByText('Seguimiento de control')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(
      'A follow-up that has already been closed or validated cannot be deleted; it preserves the shelter history',
    )
    expect(screen.getByText('Seguimiento de control')).toBeInTheDocument()
  })

  it('shows the empty state when the adoption has no follow-ups', async () => {
    vi.mocked(getFollowUps).mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Esta adopción aún no tiene seguimientos registrados.'),
    ).toBeInTheDocument()
  })

  it('shows the backend message on error', async () => {
    vi.mocked(getFollowUps).mockRejectedValue(new ApiError('Adoption not found', 404))
    renderPage()

    expect(await screen.findByText('Adoption not found')).toBeInTheDocument()
  })

  it('lets the shelter administrator read without the register action', async () => {
    vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1 })
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    expect(await screen.findByText('Seguimiento de control')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar seguimiento' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('shows the adopter the nearest pending check-up highlighted, read-only', async () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 2 })
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 1, date: PAST, observation: 'Seguimiento cerrado', veterinarian: null, adoption: { id: 1 } },
      { id: 2, date: '2030-03-01T00:00:00.000+00:00', observation: 'Control lejano', veterinarian: null, adoption: { id: 1 } },
      { id: 3, date: FUTURE, observation: 'Control próximo', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    expect(await screen.findByText('Próximo control: 15 ene 2030')).toBeInTheDocument()
    expect(screen.getAllByText('Control próximo')).toHaveLength(2)
    expect(screen.queryByRole('link', { name: 'Registrar seguimiento' })).toBeNull()
  })

  it('marks the most recent follow-up as overdue when everything already passed', async () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 2 })
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 1, date: '2019-06-15T00:00:00.000+00:00', observation: 'El más antiguo', veterinarian: null, adoption: { id: 1 } },
      { id: 2, date: PAST, observation: 'El más reciente', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    expect(await screen.findByText('Control vencido: 1 ene 2020')).toBeInTheDocument()
    expect(screen.getAllByText('El más reciente')).toHaveLength(2)
  })

  it('uses the adopter wording for the empty state', async () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER', userId: 2 })
    vi.mocked(getFollowUps).mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Tu mascota aún no tiene seguimientos registrados.'),
    ).toBeInTheDocument()
  })

  it('does not highlight the next check-up for the veterinarian', async () => {
    vi.mocked(getFollowUps).mockResolvedValue([
      { id: 2, date: FUTURE, observation: 'Seguimiento de control', veterinarian: null, adoption: { id: 1 } },
    ])
    renderPage()

    await screen.findByText('Seguimiento de control')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('blocks visitors', () => {
    vi.mocked(getSession).mockReturnValue({ role: 'VISITOR', userId: 1 })
    renderPage()

    expect(
      screen.getByText(
        'Solo el personal del refugio y el adoptante pueden consultar los seguimientos.',
      ),
    ).toBeInTheDocument()
    expect(getFollowUps).not.toHaveBeenCalled()
  })
})
