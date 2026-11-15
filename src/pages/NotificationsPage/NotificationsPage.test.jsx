import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NotificationsPage from './NotificationsPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import { getNotifications } from '../../services/notificationService'

vi.mock('../../services/notificationService', () => ({ getNotifications: vi.fn() }))
vi.mock('../../config/session', () => ({ getSession: vi.fn() }))

const NOTIFICATIONS = [
    {
        id: 3,
        message: 'Nueva mascota disponible para adopción',
        channel: 'PUSH',
        date: '2026-10-20T00:00:00.000+00:00',
        time: '2026-10-20T10:00:00.000+00:00',
        sent: false,
    },
    {
        id: 1,
        message: 'Recordatorio de vacunación - Max',
        channel: 'EMAIL',
        date: '2026-10-11T00:00:00.000+00:00',
        time: '2026-10-11T08:00:00.000+00:00',
        sent: true,
    },
    {
        id: 2,
        message: 'Seguimiento médico programado',
        channel: 'SMS',
        date: '2026-10-14T00:00:00.000+00:00',
        time: '2026-10-14T09:30:00.000+00:00',
        sent: false,
    },
]

function renderPage(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/notifications', state }]}>
            <NotificationsPage />
        </MemoryRouter>,
    )
}

const since = () => screen.getByLabelText(/^Desde/)
const until = () => screen.getByLabelText(/^Hasta/)
const filter = (user) => user.click(screen.getByRole('button', { name: 'Filtrar' }))

describe('NotificationsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 7, name: 'AdminUser' })
        getNotifications.mockResolvedValue(NOTIFICATIONS)
    })

    it('loads the notifications of the user without filters', async () => {
        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
        expect(await screen.findAllByRole('listitem')).toHaveLength(3)
        expect(getNotifications).toHaveBeenCalledWith(7, { startDate: '', endDate: '' })
        expect(screen.getByRole('heading', { name: 'Mis notificaciones' })).toBeInTheDocument()
    })

    it('shows each notification with its channel, status, date and hour, oldest first', async () => {
        renderPage()

        const items = await screen.findAllByRole('listitem')
        expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
            'Recordatorio de vacunación - Max',
            'Seguimiento médico programado',
            'Nueva mascota disponible para adopción',
        ])
        expect(within(items[0]).getByText('EMAIL')).toBeInTheDocument()
        expect(within(items[0]).getByText('Enviada')).toBeInTheDocument()
        expect(within(items[0]).getByText('11/10/2026 · 08:00 AM')).toBeInTheDocument()
        expect(within(items[1]).getByText('SMS')).toBeInTheDocument()
        expect(within(items[1]).getByText('Pendiente')).toBeInTheDocument()
        expect(within(items[1]).getByText('14/10/2026 · 09:30 AM')).toBeInTheDocument()
    })

    it('links every notification to its detail and offers to schedule a new one', async () => {
        renderPage()

        expect(
            await screen.findByRole('link', { name: 'Ver detalle de Seguimiento médico programado' }),
        ).toHaveAttribute('href', '/notifications/2/edit')
        expect(screen.getByRole('link', { name: 'Programar notificación' })).toHaveAttribute(
            'href',
            '/notifications/new',
        )
    })

    it('filters by the selected dates when the user presses Filtrar', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')

        fireEvent.change(since(), { target: { value: '2026-10-01' } })
        fireEvent.change(until(), { target: { value: '2026-10-31' } })
        await filter(user)

        await waitFor(() =>
            expect(getNotifications).toHaveBeenLastCalledWith(7, {
                startDate: '2026-10-01',
                endDate: '2026-10-31',
            }),
        )
    })

    it('does not request anything until Filtrar is pressed', async () => {
        renderPage()
        await screen.findAllByRole('listitem')

        fireEvent.change(since(), { target: { value: '2026-10-01' } })

        expect(getNotifications).toHaveBeenCalledTimes(1)
    })

    it('accepts a range of a single day and only one date', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')

        fireEvent.change(since(), { target: { value: '2026-10-05' } })
        fireEvent.change(until(), { target: { value: '2026-10-05' } })
        await filter(user)
        await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(2))

        fireEvent.change(since(), { target: { value: '' } })
        await filter(user)
        await waitFor(() =>
            expect(getNotifications).toHaveBeenLastCalledWith(7, {
                startDate: '',
                endDate: '2026-10-05',
            }),
        )
        expect(screen.queryByText(/no puede ser posterior/)).not.toBeInTheDocument()
    })

    it('refuses a start date after the end date without asking the back-end', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')

        fireEvent.change(since(), { target: { value: '2026-11-01' } })
        fireEvent.change(until(), { target: { value: '2026-10-31' } })
        await filter(user)

        expect(
            screen.getByText('La fecha inicial no puede ser posterior a la fecha final.'),
        ).toBeInTheDocument()
        expect(until()).toHaveAttribute('aria-invalid', 'true')
        expect(until()).toHaveFocus()
        expect(getNotifications).toHaveBeenCalledTimes(1)
    })

    it('clears the range error when a date is edited', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')
        fireEvent.change(since(), { target: { value: '2026-11-01' } })
        fireEvent.change(until(), { target: { value: '2026-10-31' } })
        await filter(user)

        fireEvent.change(until(), { target: { value: '2026-11-30' } })

        expect(screen.queryByText(/no puede ser posterior/)).not.toBeInTheDocument()
    })

    it('explains when the user has no notifications', async () => {
        getNotifications.mockResolvedValue([])

        renderPage()

        expect(await screen.findByText('Aún no tienes notificaciones.')).toBeInTheDocument()
    })

    it('explains when no notification is in the selected range', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')
        getNotifications.mockResolvedValue([])

        fireEvent.change(since(), { target: { value: '2030-01-01' } })
        await filter(user)

        expect(
            await screen.findByText(
                'No se encontraron notificaciones en el rango de fechas seleccionado.',
            ),
        ).toBeInTheDocument()
    })

    it('shows the back-end error', async () => {
        getNotifications.mockRejectedValue(new ApiError('User not found', 404))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('User not found')
    })

    it('shows a dash for a notification without channel, date or hour', async () => {
        getNotifications.mockResolvedValue([{ id: 9, message: 'Sin datos', sent: false }])

        renderPage()

        const item = await screen.findByRole('listitem')
        expect(within(item).getByText('—')).toBeInTheDocument()
        expect(within(item).getByText('— · —')).toBeInTheDocument()
    })

    it.each([
        ['scheduled', 'La notificación se programó correctamente.'],
        ['updated', 'La notificación se actualizó correctamente.'],
        ['deleted', 'La notificación se eliminó correctamente.'],
    ])('confirms the action when arriving after "%s"', async (name, message) => {
        renderPage({ [name]: true })

        await screen.findAllByRole('listitem')
        expect(screen.getByRole('status')).toHaveTextContent(message)
    })

    it('does not show a confirmation on a normal visit', async () => {
        renderPage()

        await screen.findAllByRole('listitem')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('ignores the answer of a request that finished after leaving the page', async () => {
        let resolveRequest
        getNotifications.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)))

        const { unmount } = renderPage()
        unmount()
        resolveRequest(NOTIFICATIONS)

        await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(1))
    })

    it('ignores the error of a request that failed after leaving the page', async () => {
        let rejectRequest
        getNotifications.mockReturnValue(new Promise((_, reject) => (rejectRequest = reject)))

        const { unmount } = renderPage()
        unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(1))
    })
})