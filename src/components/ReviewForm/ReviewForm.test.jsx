import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dayStartISO } from '../../utils/dates'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ReviewForm from './ReviewForm'
import { ApiError } from '../../services/apiClient'

const DEFAULTS = { rating: 4, date: '2026-09-05', comment: 'Max se adaptó muy rápido' }

function renderForm(props = {}) {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
        <MemoryRouter initialEntries={['/form']}>
            <Routes>
                <Route
                    path="/form"
                    element={
                        <ReviewForm
                            petName="Max"
                            ariaLabel="Formulario"
                            submitLabel="Publicar"
                            notice="Aviso de prueba"
                            backPath="/reviews"
                            onSubmit={onSubmit}
                            {...props}
                        />
                    }
                />
                <Route path="/reviews" element={<p>Listado</p>} />
            </Routes>
        </MemoryRouter>,
    )
    return { onSubmit }
}

const comment = () => screen.getByRole('textbox', { name: 'Comentario' })
const date = () => screen.getByLabelText(/^Fecha/)
const star = (n) => screen.getByRole('radio', { name: `${n} ${n === 1 ? 'estrella' : 'estrellas'}` })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Publicar' }))

describe('ReviewForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the pet read-only, an empty form and its notice', () => {
        renderForm()

        expect(screen.getByRole('textbox', { name: 'Mascota' })).toHaveValue('Max')
        expect(screen.getByRole('textbox', { name: 'Mascota' })).toHaveAttribute('readonly')
        expect(screen.getByText('Sin calificar')).toBeInTheDocument()
        expect(date()).toHaveValue('')
        expect(comment()).toHaveValue('')
        expect(screen.getByText('Aviso de prueba')).toBeInTheDocument()
        expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    })

    it('starts from the default values when they are given', () => {
        renderForm({ defaultValues: DEFAULTS })

        expect(star(4)).toBeChecked()
        expect(date()).toHaveValue('2026-09-05')
        expect(comment()).toHaveValue('Max se adaptó muy rápido')
    })

    it('blocks the request and marks every empty field', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm()

        await submit(user)

        expect(onSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Selecciona una calificación.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona la fecha.')).toBeInTheDocument()
        expect(screen.getByText('Escribe un comentario.')).toBeInTheDocument()
        expect(screen.getByRole('radiogroup')).toHaveFocus()
    })

    it('focuses the first invalid field, even when it is not the rating', async () => {
        const user = userEvent.setup()
        renderForm({ defaultValues: { ...DEFAULTS, comment: '' } })

        await submit(user)

        expect(comment()).toHaveFocus()
        expect(screen.queryByText('Selecciona una calificación.')).not.toBeInTheDocument()
    })

    it('clears the error of the rating when a star is chosen and of the others when edited', async () => {
        const user = userEvent.setup()
        renderForm()
        await submit(user)

        await user.click(star(5))
        await user.type(comment(), 'Excelente')
        fireEvent.change(date(), { target: { value: '2026-09-05' } })

        expect(screen.queryByText('Selecciona una calificación.')).not.toBeInTheDocument()
        expect(screen.queryByText('Escribe un comentario.')).not.toBeInTheDocument()
        expect(screen.queryByText('Selecciona la fecha.')).not.toBeInTheDocument()
    })

    it('sends the review with the given time', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm({ defaultValues: DEFAULTS, time: '09:30' })

        await submit(user)

        expect(onSubmit).toHaveBeenCalledWith({
            rating: 4,
            comment: 'Max se adaptó muy rápido',
            date: dayStartISO('2026-09-05'),
            time: '2026-09-05T09:30:00.000Z',
        })
    })

    it('uses the moment of writing when no time is given', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm({ defaultValues: DEFAULTS })

        await submit(user)

        expect(onSubmit.mock.calls[0][0].time).toMatch(/^2026-09-05T\d{2}:\d{2}:00\.000Z$/)
    })

    it('writes a new review step by step', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderForm({ time: '10:00' })

        await user.click(star(5))
        fireEvent.change(date(), { target: { value: '2026-09-05' } })
        await user.type(comment(), '  Gracias por todo ')
        await submit(user)

        expect(onSubmit).toHaveBeenCalledWith({
            rating: 5,
            comment: 'Gracias por todo',
            date: dayStartISO('2026-09-05'),
            time: '2026-09-05T10:00:00.000Z',
        })
    })

    it('disables saving and shows progress while the request is in progress', async () => {
        const user = userEvent.setup()
        renderForm({ defaultValues: DEFAULTS, onSubmit: vi.fn(() => new Promise(() => { })) })

        await submit(user)

        expect(await screen.findByText('Guardando cambios...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
    })

    it('explains a back-end error tied to a field and returns the focus to it', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi.fn().mockRejectedValue(new ApiError('Comment cannot be null or empty', 412)),
        })

        await submit(user)

        const dialog = await screen.findByRole('alertdialog')
        expect(dialog).toHaveTextContent('Error al guardar la reseña')
        expect(dialog).toHaveTextContent('Comment cannot be null or empty')
        expect(comment()).toHaveAttribute('aria-invalid', 'true')

        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(comment()).toHaveFocus()
    })

    it('closes an error that is not tied to a field without marking any field', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi.fn().mockRejectedValue(new ApiError('This adopter has already reviewed this pet', 412)),
        })

        await submit(user)

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('already reviewed')
        expect(comment()).not.toHaveAttribute('aria-invalid', 'true')
        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled()
    })

    it('goes back from the error dialog', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: DEFAULTS,
            onSubmit: vi.fn().mockRejectedValue(new ApiError('Pet not found', 404)),
        })

        await submit(user)
        await user.click(await screen.findByRole('button', { name: 'Cancelar / Volver' }))

        expect(await screen.findByText('Listado')).toBeInTheDocument()
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
            expect(dialog).toHaveTextContent('¿Eliminar la reseña?')
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
        })

        it('explains why the review could not be deleted', async () => {
            const user = userEvent.setup()
            const onDelete = vi
                .fn()
                .mockRejectedValue(new ApiError('Only the adopter who authored the review can perform this operation', 412))
            renderForm({ defaultValues: DEFAULTS, onDelete })

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            const errorDialog = await screen.findByRole('alertdialog')
            expect(errorDialog).toHaveTextContent('Error al eliminar la reseña')
            expect(errorDialog).toHaveTextContent('Only the adopter')
        })
    })
})