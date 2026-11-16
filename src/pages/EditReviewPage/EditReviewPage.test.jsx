import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dayStartISO } from '../../utils/dates'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EditReviewPage from './EditReviewPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { deleteReview, getReview, updateReview } from '../../services/reviewService'

vi.mock('../../services/reviewService', () => ({
    getReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const REVIEW = {
    id: 5,
    rating: 5,
    comment: 'Max se adaptó muy rápido a nuestra casa.',
    date: '2026-09-05T00:00:00.000+00:00',
    time: '2026-09-05T14:07:00.000+00:00',
    pet: { id: 3, name: 'Max' },
}

function ListStub() {
    const { state } = useLocation()
    const shown = ['updated', 'deleted'].find((name) => state?.[name])
    return <p>Reseñas {shown ?? 'sin aviso'}</p>
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/pets/3/reviews/5/edit']}>
            <Routes>
                <Route path="/pets/:petId/reviews/:reviewId/edit" element={<EditReviewPage />} />
                <Route path="/pets/:petId/reviews" element={<ListStub />} />
            </Routes>
        </MemoryRouter>,
    )
}

async function renderLoaded(review = REVIEW) {
    getReview.mockResolvedValue(review)
    renderPage()
    await screen.findByRole('form', { name: 'Edición de reseña' })
}

const comment = () => screen.getByRole('textbox', { name: 'Comentario' })

describe('EditReviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 7, role: 'ADOPTER' })
    })

    it('loads the review and shows its data', async () => {
        await renderLoaded()

        expect(getReview).toHaveBeenCalledWith('3', '5')
        expect(screen.getByRole('heading', { name: 'Mi reseña' })).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Mascota' })).toHaveValue('Max')
        expect(screen.getByRole('radio', { name: '5 estrellas' })).toBeChecked()
        expect(screen.getByLabelText(/^Fecha/)).toHaveValue('2026-09-05')
        expect(comment()).toHaveValue('Max se adaptó muy rápido a nuestra casa.')
        expect(screen.getByText('Solo el autor de la reseña puede editarla o eliminarla.')).toBeInTheDocument()
    })

    it('shows an empty pet name when the review does not say which pet it is', async () => {
        await renderLoaded({ ...REVIEW, pet: undefined })

        expect(screen.getByRole('textbox', { name: 'Mascota' })).toHaveValue('')
    })

    it('updates the review as its author keeping the time it had', async () => {
        const user = userEvent.setup()
        updateReview.mockResolvedValue({})
        await renderLoaded()

        await user.click(screen.getByRole('radio', { name: '4 estrellas' }))
        fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-06' } })
        await user.clear(comment())
        await user.type(comment(), 'Sigue feliz')
        await user.click(screen.getByRole('button', { name: 'Guardar' }))

        expect(updateReview).toHaveBeenCalledWith('3', 5, 7, {
            rating: 4,
            comment: 'Sigue feliz',
            date: dayStartISO('2026-09-06'),
            time: '2026-09-06T14:07:00.000Z',
        })
        expect(await screen.findByText('Reseñas updated')).toBeInTheDocument()
    })

    it('does not update when the comment is emptied', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.clear(comment())
        await user.click(screen.getByRole('button', { name: 'Guardar' }))

        expect(updateReview).not.toHaveBeenCalled()
        expect(screen.getByText('Escribe un comentario.')).toBeInTheDocument()
    })

    it('shows the back-end error when someone else tries to edit it', async () => {
        const user = userEvent.setup()
        updateReview.mockRejectedValue(
            new ApiError('Only the adopter who authored the review can perform this operation', 412),
        )
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Guardar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Only the adopter')
    })

    it('deletes the review after confirming and goes back to the list', async () => {
        const user = userEvent.setup()
        deleteReview.mockResolvedValue(null)
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Eliminar' }))
        const dialog = await screen.findByRole('alertdialog')
        await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

        expect(deleteReview).toHaveBeenCalledWith('3', 5, 7)
        expect(await screen.findByText('Reseñas deleted')).toBeInTheDocument()
    })

    it('shows the back-end error when the deletion is refused', async () => {
        const user = userEvent.setup()
        deleteReview.mockRejectedValue(new ApiError('Review not found', 404))
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Eliminar' }))
        const dialog = await screen.findByRole('alertdialog')
        await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Error al eliminar la reseña')
    })

    it('shows a loading state and the back-end error when the review cannot be loaded', async () => {
        getReview.mockReturnValueOnce(new Promise(() => { }))
        const first = renderPage()
        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
        first.unmount()

        getReview.mockRejectedValue(new ApiError('Review not found', 404))
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Review not found')
    })

    it('only lets an adopter edit reviews', () => {
        getSession.mockReturnValue({ userId: 1, role: 'SHELTER_ADMIN' })

        renderPage()

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Solo un adoptante puede editar o eliminar su reseña.',
        )
        expect(getReview).not.toHaveBeenCalled()
    })

    it('ignores the answer or the error of a request that finished after leaving the page', async () => {
        let resolveRequest
        getReview.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)))
        renderPage().unmount()
        resolveRequest(REVIEW)

        let rejectRequest
        getReview.mockReturnValueOnce(new Promise((_, reject) => (rejectRequest = reject)))
        renderPage().unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getReview).toHaveBeenCalledTimes(2))
    })
})