import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TrialCohabitationDetailPage from './TrialCohabitationDetailPage'
import { getSession } from '../../config/roleSession'
import { ApiError } from '../../services/apiClient'
import {
  getTrialCohabitationRequest,
  updateTrialCohabitationRequest,
} from '../../services/trialCohabitationService'

vi.mock('../../services/trialCohabitationService', () => ({
  getTrialCohabitationRequest: vi.fn(),
  updateTrialCohabitationRequest: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', VETERINARIAN: 'VETERINARIAN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const REQUEST = {
  id: 1,
  status: 'PENDING',
  date: '2026-11-03',
  description: 'Quiero convivir con Luna',
  startDate: '2026-11-10',
  endDate: '2026-11-20',
  shelter: { id: 1, name: 'Refugio Patitas' },
  adopter: { id: 2, firstName: 'Carlos', lastName: 'Perez', email: 'carlos@mail.com', phone: '3000000000' },
  pet: { id: 1, name: 'Luna', species: 'Perro', shelter: { id: 1, name: 'Refugio Patitas' } },
  trialCohabitation: null,
}

function renderPage(requestId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/trial-cohabitation-requests/${requestId}`]}>
      <Routes>
        <Route path="/trial-cohabitation-requests/:requestId" element={<TrialCohabitationDetailPage />} />
        <Route path="/trial-cohabitation-requests" element={<p>Mis solicitudes</p>} />
        <Route path="/trial-cohabitation-requests/received" element={<p>Recibidas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TrialCohabitationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 2 })
    getTrialCohabitationRequest.mockResolvedValue(REQUEST)
    updateTrialCohabitationRequest.mockImplementation(async (id, body) => ({
      ...REQUEST,
      status: body.status,
    }))
  })

  it('shows the details of the request to the adopter who sent it', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(getTrialCohabitationRequest).toHaveBeenCalledWith('1')
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument()
    expect(screen.getByText('carlos@mail.com · 3000000000')).toBeInTheDocument()
    expect(screen.getByText('Refugio Patitas')).toBeInTheDocument()
    expect(screen.getByText('10 nov 2026')).toBeInTheDocument()
    expect(screen.getByText('20 nov 2026')).toBeInTheDocument()
    expect(screen.getByText('(11 días)')).toBeInTheDocument()
    expect(screen.getByText('Quiero convivir con Luna')).toBeInTheDocument()
  })

  it('links the adopter back to the list of their requests', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    expect(screen.getByRole('link', { name: 'Volver a mis solicitudes' })).toHaveAttribute(
      'href',
      '/trial-cohabitation-requests',
    )
  })

  it('shows the same request to the shelter that owns the pet', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a las solicitudes recibidas' })).toHaveAttribute(
      'href',
      '/trial-cohabitation-requests/received',
    )
  })

  it('denies the request to an adopter who did not send it', async () => {
    getSession.mockReturnValue({ role: 'ADOPTER', userId: 9 })
    renderPage()

    expect(
      await screen.findByText('No tienes acceso a esta solicitud de convivencia de prueba.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Quiero convivir con Luna')).not.toBeInTheDocument()
  })

  it('denies the request to a shelter that does not own the pet', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 5, shelterId: 2 })
    renderPage()

    expect(
      await screen.findByText('No tienes acceso a esta solicitud de convivencia de prueba.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Carlos Perez')).not.toBeInTheDocument()
  })

  it('shows the back-end message when the request does not exist', async () => {
    getTrialCohabitationRequest.mockRejectedValue(
      new ApiError('The trial cohabitation request with the given id was not found', 404),
    )
    renderPage('999')

    expect(
      await screen.findByText('The trial cohabitation request with the given id was not found'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mis solicitudes' })).toBeInTheDocument()
  })

  it('lets the user retry after a connection error', async () => {
    const user = userEvent.setup()
    getTrialCohabitationRequest.mockRejectedValueOnce(
      new ApiError('No se pudo conectar con el servidor.', 0),
    )
    renderPage()

    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Luna — Perro' })).toBeInTheDocument()
    expect(getTrialCohabitationRequest).toHaveBeenCalledTimes(2)
  })

  it('offers the shelter the decisions on a pending request', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    expect(screen.getByRole('button', { name: 'Aprobar solicitud' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar solicitud' })).toBeInTheDocument()
  })

  it('does not offer the decisions to the adopter', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    expect(screen.queryByRole('button', { name: 'Aprobar solicitud' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar solicitud' })).not.toBeInTheDocument()
  })

  it('does not offer the decisions once the request is no longer pending', async () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    getTrialCohabitationRequest.mockResolvedValue({ ...REQUEST, status: 'APPROVED' })
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    expect(screen.queryByRole('button', { name: 'Aprobar solicitud' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar solicitud' })).not.toBeInTheDocument()
  })

  it('approves the request after confirmation and shows the new status', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    await user.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Aprobar esta solicitud?' })
    expect(updateTrialCohabitationRequest).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Aprobar solicitud' }))

    await waitFor(() =>
      expect(updateTrialCohabitationRequest).toHaveBeenCalledWith('1', {
        status: 'APPROVED',
        description: 'Quiero convivir con Luna',
      }),
    )
    expect(
      await screen.findByRole('dialog', { name: '¡Solicitud aprobada con éxito!' }),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-status="APPROVED"]')).toHaveTextContent('Aprobada')
    expect(screen.queryByRole('button', { name: 'Aprobar solicitud' })).not.toBeInTheDocument()
  })

  it('rejects the request after confirmation', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    await user.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Rechazar esta solicitud?' })
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar solicitud' }))

    await waitFor(() =>
      expect(updateTrialCohabitationRequest).toHaveBeenCalledWith('1', {
        status: 'REJECTED',
        description: 'Quiero convivir con Luna',
      }),
    )
    expect(
      await screen.findByRole('dialog', { name: '¡Solicitud rechazada con éxito!' }),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-status="REJECTED"]')).toHaveTextContent('Rechazada')
  })

  it('does not change the request when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    await user.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Aprobar esta solicitud?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(updateTrialCohabitationRequest).not.toHaveBeenCalled()
    expect(document.querySelector('[data-status="PENDING"]')).toHaveTextContent('Pendiente')
  })

  it('shows the back-end message when the decision is refused', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 1, shelterId: 1 })
    updateTrialCohabitationRequest.mockRejectedValue(
      new ApiError('A finalized request (approved, rejected or cancelled) cannot be modified', 412),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Luna — Perro' })

    await user.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Aprobar esta solicitud?' })
    await user.click(within(dialog).getByRole('button', { name: 'Aprobar solicitud' }))

    const errorDialog = await screen.findByRole('alertdialog', {
      name: 'No se pudo guardar la decisión',
    })
    expect(
      within(errorDialog).getByText(
        'A finalized request (approved, rejected or cancelled) cannot be modified',
      ),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-status="PENDING"]')).toHaveTextContent('Pendiente')
  })

  it('notes when the request already generated a trial cohabitation', async () => {
    getTrialCohabitationRequest.mockResolvedValue({ ...REQUEST, trialCohabitation: { id: 4 } })
    renderPage()

    expect(
      await screen.findByText('Esta solicitud ya generó una convivencia de prueba.'),
    ).toBeInTheDocument()
  })
})
