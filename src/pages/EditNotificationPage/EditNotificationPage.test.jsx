import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EditNotificationPage from './EditNotificationPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import {
    deleteNotification,
    getNotification,
    updateNotification,
} from '../../services/notificationService'

vi.mock('../../services/notificationService', () => ({
    getNotification: vi.fn(),
    updateNotification: vi.fn(),
    deleteNotification: vi.fn(),
}))
vi.mock('../../config/session', () => ({ getSession: vi.fn() }))

const PENDING = {
    id: 5,
    message: 'Recordatorio de vacuna',
    channel: 'EMAIL',
    date: '2026-10-14T00:00:00.000+00:00',
    time: '2026-10-14T09:30:00.000+00:00',
    content: 'Vacuna de refuerzo de Max',
    sent: false,
}

function ListStub() {
    const { state } = useLocation()
    const shown = ['updated', 'deleted'].find((name) => state?.[name])
    return <p>Listado {shown ?? 'sin aviso'}</p>
}

function renderPage(id = '5') {
    return render(
        <MemoryRouter initialEntries={[`/notifications/${id}/edit`]}>
            <Routes>
                <Route path="/notifications/:notificationId/edit" element={<EditNotificationPage />} />
                <Route path="/notifications" element={<ListStub />} />
            </Routes>
        </MemoryRouter>,
    )
}

async function renderLoaded(notification = PENDING) {
    getNotification.mockResolvedValue(notification)
    renderPage()
    await screen.findByRole('form', { name: 'Edición de notificación' })
}

const textbox = (name) => screen.getByRole('textbox', { name })
const channel = () => screen.getByRole('combobox', { name: 'Canal' })

describe('EditNotificationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 7, name: 'AdminUser' })
    })

    it('loads the notification of the user and shows its data', async () => {
        await renderLoaded()

        expect(getNotification).toHaveBeenCalledWith(7, '5')
        expect(screen.getByRole('heading', { name: 'Editar notificación' })).toBeInTheDocument()
        expect(screen.getByText('Estado: Pendiente')).toBeInTheDocument()
        expect(textbox('Mensaje')).toHaveValue('Recordatorio de vacuna')
        expect(channel()).toHaveValue('EMAIL')
        expect(screen.getByLabelText(/^Fecha/)).toHaveValue('2026-10-14')
        expect(screen.getByLabelText(/^Hora/)).toHaveValue('09:30')
        expect(textbox('Contenido')).toHaveValue('Vacuna de refuerzo de Max')
        expect(
            screen.getByText('Una notificación ya enviada no puede eliminarse ni cambiar de canal.'),
        ).toBeInTheDocument()
    })

    it('lets a pending notification change channel and be deleted', async () => {
        await renderLoaded()

        expect(channel()).toBeEnabled()
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled()
    })

    it('does not let a sent notification change channel or be deleted', async () => {
        await renderLoaded({ ...PENDING, sent: true })

        expect(screen.getByText('Estado: Enviada')).toBeInTheDocument()
        expect(channel()).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled()
    })

    it('shows a loading state while the notification is requested', () => {
        getNotification.mockReturnValue(new Promise(() => { }))

        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    })

    it('shows the back-end error when the notification cannot be loaded', async () => {
        getNotification.mockRejectedValue(new ApiError('Notification not found', 404))

        renderPage('999')

        expect(await screen.findByRole('alert')).toHaveTextContent('Notification not found')
        expect(screen.getByRole('link', { name: 'Volver a notificaciones' })).toHaveAttribute(
            'href',
            '/notifications',
        )
    })

    it('ignores the answer of a request that finished after leaving the page', async () => {
        let resolveRequest
        getNotification.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)))

        const { unmount } = renderPage()
        unmount()
        resolveRequest(PENDING)

        await waitFor(() => expect(getNotification).toHaveBeenCalledTimes(1))
    })

    it('ignores the error of a request that failed after leaving the page', async () => {
        let rejectRequest
        getNotification.mockReturnValue(new Promise((_, reject) => (rejectRequest = reject)))

        const { unmount } = renderPage()
        unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getNotification).toHaveBeenCalledTimes(1))
    })

    it('updates the notification and goes back to the list confirmed', async () => {
        const user = userEvent.setup()
        updateNotification.mockResolvedValue({ ...PENDING })
        await renderLoaded()

        await user.clear(textbox('Mensaje'))
        await user.type(textbox('Mensaje'), 'Nuevo mensaje')
        await user.selectOptions(channel(), 'PUSH')
        fireEvent.change(screen.getByLabelText(/^Hora/), { target: { value: '10:45' } })
        await user.click(screen.getByRole('button', { name: 'Actualizar' }))

        expect(updateNotification).toHaveBeenCalledWith(7, 5, {
            message: 'Nuevo mensaje',
            channel: 'PUSH',
            date: '2026-10-14',
            time: '2026-10-14T10:45:00.000Z',
            content: 'Vacuna de refuerzo de Max',
        })
        expect(await screen.findByText('Listado updated')).toBeInTheDocument()
    })

    it('does not update when a required field is emptied', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.clear(textbox('Contenido'))
        await user.click(screen.getByRole('button', { name: 'Actualizar' }))

        expect(updateNotification).not.toHaveBeenCalled()
        expect(screen.getByText('Escribe el contenido.')).toBeInTheDocument()
    })

    it('keeps the same channel when updating a sent notification', async () => {
        const user = userEvent.setup()
        updateNotification.mockResolvedValue({})
        await renderLoaded({ ...PENDING, sent: true, channel: 'sms' })

        await user.click(screen.getByRole('button', { name: 'Actualizar' }))

        expect(updateNotification).toHaveBeenCalledWith(
            7,
            5,
            expect.objectContaining({ channel: 'SMS' }),
        )
    })

    it('shows the back-end error when the update is refused', async () => {
        const user = userEvent.setup()
        updateNotification.mockRejectedValue(new ApiError('Notification not found', 404))
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Actualizar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Notification not found')
    })

    it('deletes a pending notification after confirming and goes back to the list', async () => {
        const user = userEvent.setup()
        deleteNotification.mockResolvedValue(null)
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Eliminar' }))
        const dialog = await screen.findByRole('alertdialog')
        await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

        expect(deleteNotification).toHaveBeenCalledWith(7, 5)
        expect(await screen.findByText('Listado deleted')).toBeInTheDocument()
    })

    it('shows the back-end error when the deletion is refused', async () => {
        const user = userEvent.setup()
        deleteNotification.mockRejectedValue(new ApiError('Notification not found', 404))
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Eliminar' }))
        const dialog = await screen.findByRole('alertdialog')
        await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Error al eliminar')
    })
})