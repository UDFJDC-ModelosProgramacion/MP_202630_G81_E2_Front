import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ScheduleNotificationPage from './ScheduleNotificationPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import { createNotification } from '../../services/notificationService'

vi.mock('../../services/notificationService', () => ({ createNotification: vi.fn() }))
vi.mock('../../config/session', () => ({ getSession: vi.fn() }))

function ListStub() {
    const { state } = useLocation()
    return <p>Listado {state?.scheduled ? 'con aviso' : 'sin aviso'}</p>
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/notifications/new']}>
            <Routes>
                <Route path="/notifications/new" element={<ScheduleNotificationPage />} />
                <Route path="/notifications" element={<ListStub />} />
            </Routes>
        </MemoryRouter>,
    )
}

async function fillForm(user) {
    await user.type(screen.getByRole('textbox', { name: 'Mensaje' }), 'Recordatorio de vacuna')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Canal' }), 'SMS')
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-10-14' } })
    fireEvent.change(screen.getByLabelText(/^Hora/), { target: { value: '09:30' } })
    await user.type(screen.getByRole('textbox', { name: 'Contenido' }), 'Vacuna de refuerzo')
}

describe('ScheduleNotificationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 7, name: 'AdminUser' })
    })

    it('shows the form with the available channels and a way back', () => {
        renderPage()

        expect(screen.getByRole('heading', { name: 'Programar notificación' })).toBeInTheDocument()
        expect(
            screen.getByText('Canales disponibles: correo (EMAIL), SMS o notificación push (PUSH).'),
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Programar' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Volver a notificaciones' })).toHaveAttribute(
            'href',
            '/notifications',
        )
    })

    it('schedules the notification for the user and goes back to the list confirmed', async () => {
        const user = userEvent.setup()
        createNotification.mockResolvedValue({ id: 1 })
        renderPage()

        await fillForm(user)
        await user.click(screen.getByRole('button', { name: 'Programar' }))

        expect(createNotification).toHaveBeenCalledWith(7, {
            message: 'Recordatorio de vacuna',
            channel: 'SMS',
            date: '2026-10-14',
            time: '2026-10-14T09:30:00.000Z',
            content: 'Vacuna de refuerzo',
        })
        expect(await screen.findByText('Listado con aviso')).toBeInTheDocument()
    })

    it('does not send anything when the form is empty', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.click(screen.getByRole('button', { name: 'Programar' }))

        expect(createNotification).not.toHaveBeenCalled()
        expect(screen.getByText('Escribe el mensaje.')).toBeInTheDocument()
    })

    it('shows the back-end error and stays on the form', async () => {
        const user = userEvent.setup()
        createNotification.mockRejectedValue(new ApiError('User not found', 404))
        renderPage()

        await fillForm(user)
        await user.click(screen.getByRole('button', { name: 'Programar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('User not found')
        expect(screen.queryByText(/Listado/)).not.toBeInTheDocument()
    })
})