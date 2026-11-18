import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NotificationForm from './NotificationForm'
import { ApiError } from '../../services/apiClient'

const DEFAULTS = {
    message: 'Recordatorio de vacuna',
    channel: 'EMAIL',
    date: '2026-10-14',
    time: '09:30',
    content: 'Vacuna de refuerzo de Max',
}

function renderForm(props = {}) {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
        <MemoryRouter initialEntries={['/form']}>
            <Routes>
                <Route
                    path="/form"
                    element={
                        <NotificationForm
                            ariaLabel="Formulario"
                            submitLabel="Guardar"
                            notice="Aviso de prueba"
                            onSubmit={onSubmit}
                            {...props}
                        />
                    }
                />
                <Route path="/notifications" element={<p>Listado</p>} />
            </Routes>
        </MemoryRouter>,
    )
    return { onSubmit }
}

const textbox = (name) => screen.getByRole('textbox', { name })
const channel = () => screen.getByRole('combobox', { name: 'Canal' })
const date = () => screen.getByLabelText(/^Fecha/)
const time = () => screen.getByLabelText(/^Hora/)
const submit = (user) => user.click(screen.getByRole('button', { name: 'Guardar' }))

async function fillForm(user, values = DEFAULTS) {
    await user.type(textbox('Mensaje'), values.message)
    await user.selectOptions(channel(), values.channel)
    fireEvent.change(date(), { target: { value: values.date } })
    fireEvent.change(time(), { target: { value: values.time } })
    await user.type(textbox('Contenido'), values.content)
}

describe('NotificationForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows an empty form with its notice and the required fields hint', () => {
        renderForm()

        expect(screen.getByRole('form', { name: 'Formulario' })).toBeInTheDocument()
        expect(textbox('Mensaje')).toHaveValue('')
        expect(channel()).toHaveValue('')
        expect(date()).toHaveValue('')
        expect(time()).toHaveValue('')
        expect(screen.getByText('Aviso de prueba')).toBeInTheDocument()
        expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('offers the three channels', () => {
        renderForm()

        const options = within(channel())
            .getAllByRole('option')
            .map((option) => option.textContent)
        expect(options).toEqual(['Seleccione un canal', 'EMAIL', 'SMS', 'PUSH'])
    })

    it('starts from the default values when they are given', () => {
        renderForm({ defaultValues: DEFAULTS })

        expect(textbox('Mensaje')).toHaveValue('Recordatorio de vacuna')
        expect(channel()).toHaveValue('EMAIL')
        expect(date()).toHaveValue('2026-10-14')
        expect(time()).toHaveValue('09:30')
        expect(textbox('Contenido')).toHaveValue('Vacuna de refuerzo de Max')
    })

    it('blocks the request and marks every empty field', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm()

        await submit(user)

        expect(onSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Escribe el mensaje.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona un canal.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona la fecha.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona la hora.')).toBeInTheDocument()
        expect(screen.getByText('Escribe el contenido.')).toBeInTheDocument()
        expect(textbox('Mensaje')).toHaveAttribute('aria-invalid', 'true')
        expect(textbox('Mensaje')).toHaveFocus()
    })

    it('focuses the first invalid field, even when it is not the first one', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm({ defaultValues: { ...DEFAULTS, content: '' } })

        await submit(user)

        expect(onSubmit).not.toHaveBeenCalled()
        expect(textbox('Contenido')).toHaveFocus()
        expect(screen.queryByText('Escribe el mensaje.')).not.toBeInTheDocument()
    })

    it('clears the error of a field as soon as it is edited', async () => {
        const user = userEvent.setup()
        renderForm()
        await submit(user)

        await user.type(textbox('Mensaje'), 'Hola')

        expect(screen.queryByText('Escribe el mensaje.')).not.toBeInTheDocument()
        expect(screen.getByText('Selecciona un canal.')).toBeInTheDocument()
    })

    it('sends the trimmed notification with the day and the hour joined', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm()

        await fillForm(user, { ...DEFAULTS, message: '  Recordatorio de vacuna ' })
        await submit(user)

        expect(onSubmit).toHaveBeenCalledWith({
            message: 'Recordatorio de vacuna',
            channel: 'EMAIL',
            date: '2026-10-14',
            time: '2026-10-14T09:30:00.000Z',
            content: 'Vacuna de refuerzo de Max',
        })
    })

    it('disables saving and shows progress while the request is in progress', async () => {
        const user = userEvent.setup()
        renderForm({ defaultValues: DEFAULTS, onSubmit: vi.fn(() => new Promise(() => { })) })

        await submit(user)

        expect(await screen.findByText('Guardando cambios...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })

    it('explains a back-end error tied to a field and returns the focus to it', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi
                .fn()
                .mockRejectedValue(new ApiError('Notification channel is not valid', 412)),
        })

        await submit(user)

        const dialog = await screen.findByRole('alertdialog')
        expect(dialog).toHaveTextContent('Error al guardar la notificación')
        expect(dialog).toHaveTextContent('Notification channel is not valid')
        expect(dialog).toHaveTextContent('Conflicto de registro')
        expect(channel()).toHaveAttribute('aria-invalid', 'true')

        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(channel()).toHaveFocus()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('closes an error that is not tied to a field without marking any field', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi.fn().mockRejectedValue(new ApiError('User not found', 404)),
        })

        await submit(user)

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('No encontrado')
        expect(textbox('Mensaje')).not.toHaveAttribute('aria-invalid', 'true')
        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('goes back to the list from the error dialog', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi.fn().mockRejectedValue(new ApiError('User not found', 404)),
        })

        await submit(user)
        await user.click(await screen.findByRole('button', { name: 'Cancelar / Volver' }))

        expect(await screen.findByText('Listado')).toBeInTheDocument()
    })

    it('does not let the channel change when it is locked', () => {
        renderForm({ defaultValues: DEFAULTS, channelLocked: true })

        expect(channel()).toBeDisabled()
        expect(channel()).toHaveValue('EMAIL')
    })

    it('does not show the delete button without a delete handler', () => {
        renderForm()

        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    })

    it('disables the delete button when deleting is not allowed', () => {
        renderForm({ onDelete: vi.fn(), canDelete: false })

        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
    })

    describe('deleting', () => {
        const openConfirmation = async (user) => {
            await user.click(screen.getByRole('button', { name: 'Eliminar' }))
            return screen.findByRole('alertdialog')
        }

        it('asks for confirmation and does nothing when the user cancels', async () => {
            const user = userEvent.setup()
            const onDelete = vi.fn()
            renderForm({ defaultValues: DEFAULTS, onDelete })

            const dialog = await openConfirmation(user)
            expect(dialog).toHaveTextContent('¿Eliminar la notificación?')
            await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(onDelete).not.toHaveBeenCalled()
        })

        it('deletes once the user confirms and shows progress', async () => {
            const user = userEvent.setup()
            const onDelete = vi.fn(() => new Promise(() => { }))
            renderForm({ defaultValues: DEFAULTS, onDelete })

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            expect(onDelete).toHaveBeenCalledTimes(1)
            expect(await screen.findByText('Eliminando...')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
            expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
        })

        it('explains why the notification could not be deleted', async () => {
            const user = userEvent.setup()
            const onDelete = vi
                .fn()
                .mockRejectedValue(
                    new ApiError('A notification that has already been sent cannot be deleted', 412),
                )
            renderForm({ defaultValues: DEFAULTS, onDelete })

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            const errorDialog = await screen.findByRole('alertdialog')
            expect(errorDialog).toHaveTextContent('Error al eliminar la notificación')
            expect(errorDialog).toHaveTextContent('already been sent')
            await user.click(screen.getByRole('button', { name: 'Modificar datos' }))
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        })
    })
})