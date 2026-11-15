import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dayStartISO } from '../../utils/dates'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import WriteReviewPage from './WriteReviewPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { getPet } from '../../services/petService'
import { createReview } from '../../services/reviewService'

vi.mock('../../services/reviewService', () => ({ createReview: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPet: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const ADOPTED_PET = {
    id: 3,
    name: 'Max',
    adoptions: [
        { id: 10, status: 'PENDING' },
        { id: 11, status: 'FINALIZED' },
    ],
}

function ListStub() {
    const { state } = useLocation()
    return <p>Reseñas {state?.published ? 'publicada' : 'sin aviso'}</p>
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/pets/3/reviews/new']}>
            <Routes>
                <Route path="/pets/:petId/reviews/new" element={<WriteReviewPage />} />
                <Route path="/pets/:petId/reviews" element={<ListStub />} />
            </Routes>
        </MemoryRouter>,
    )
}

async function renderLoaded(pet = ADOPTED_PET) {
    getPet.mockResolvedValue(pet)
    renderPage()
    await screen.findByRole('form', { name: 'Escritura de reseña' })
}

async function fillForm(user) {
    await user.click(screen.getByRole('radio', { name: '5 estrellas' }))
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-05' } })
    await user.type(screen.getByRole('textbox', { name: 'Comentario' }), 'Gracias por todo')
}

describe('WriteReviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 3, role: 'ADOPTER' })
    })

    it('shows the form for the adopted pet with its notice and a way back', async () => {
        await renderLoaded()

        expect(getPet).toHaveBeenCalledWith('3')
        expect(screen.getByRole('heading', { name: 'Escriba su reseña' })).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Mascota' })).toHaveValue('Max')
        expect(
            screen.getByText('Solo puede reseñar mascotas con adopción finalizada. Una reseña por mascota.'),
        ).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Volver a las reseñas' })).toHaveAttribute(
            'href',
            '/pets/3/reviews',
        )
    })

    it('publishes the review through the finalized adoption and goes back confirmed', async () => {
        const user = userEvent.setup()
        createReview.mockResolvedValue({ id: 1 })
        await renderLoaded()

        await fillForm(user)
        await user.click(screen.getByRole('button', { name: 'Publicar' }))

        expect(createReview).toHaveBeenCalledWith(3, {
            rating: 5,
            comment: 'Gracias por todo',
            date: dayStartISO('2026-09-05'),
            time: expect.stringMatching(/^2026-09-05T\d{2}:\d{2}:00\.000Z$/),
            adoption: { id: 11 },
        })
        expect(await screen.findByText('Reseñas publicada')).toBeInTheDocument()
    })

    it('does not send anything when the form is empty', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Publicar' }))

        expect(createReview).not.toHaveBeenCalled()
        expect(screen.getByText('Selecciona una calificación.')).toBeInTheDocument()
    })

    it('shows the back-end error and stays on the form', async () => {
        const user = userEvent.setup()
        createReview.mockRejectedValue(new ApiError('This adopter has already reviewed this pet', 412))
        await renderLoaded()

        await fillForm(user)
        await user.click(screen.getByRole('button', { name: 'Publicar' }))

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('already reviewed')
        expect(screen.queryByText(/Reseñas /)).not.toBeInTheDocument()
    })

    it('explains that only adopted pets can be reviewed', async () => {
        getPet.mockResolvedValue({ id: 3, name: 'Max', adoptions: [{ id: 10, status: 'PENDING' }] })

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Solo puede reseñar mascotas con adopción finalizada.')
        expect(screen.queryByRole('form')).not.toBeInTheDocument()
    })

    it('explains that a pet without adoptions cannot be reviewed', async () => {
        getPet.mockResolvedValue({ id: 3, name: 'Max' })

        renderPage()

        expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('shows a loading state while the pet is requested', () => {
        getPet.mockReturnValue(new Promise(() => { }))

        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    })

    it('shows the back-end error when the pet cannot be loaded', async () => {
        getPet.mockRejectedValue(new ApiError('Pet not found', 404))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Pet not found')
    })

    it('only lets an adopter write reviews', () => {
        getSession.mockReturnValue({ userId: 1, role: 'SHELTER_ADMIN' })

        renderPage()

        expect(screen.getByRole('alert')).toHaveTextContent('Solo un adoptante puede escribir una reseña.')
        expect(getPet).not.toHaveBeenCalled()
    })

    it('ignores the answer or the error of a request that finished after leaving the page', async () => {
        let resolveRequest
        getPet.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)))
        const first = renderPage()
        first.unmount()
        resolveRequest(ADOPTED_PET)

        let rejectRequest
        getPet.mockReturnValueOnce(new Promise((_, reject) => (rejectRequest = reject)))
        const second = renderPage()
        second.unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getPet).toHaveBeenCalledTimes(2))
    })
})