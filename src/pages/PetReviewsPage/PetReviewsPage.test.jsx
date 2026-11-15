import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetReviewsPage from './PetReviewsPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { getPet } from '../../services/petService'
import { getReviews } from '../../services/reviewService'

vi.mock('../../services/reviewService', () => ({ getReviews: vi.fn() }))
vi.mock('../../services/petService', () => ({ getPet: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const LAURA = { id: 3, firstName: 'Laura', lastName: 'Gómez' }
const CARLOS = { id: 4, firstName: 'Carlos', lastName: 'Pérez' }

const REVIEWS = [
    {
        id: 2,
        rating: 4,
        comment: 'Un perro muy cariñoso.',
        date: '2026-08-28T00:00:00.000+00:00',
        time: '2026-08-28T10:00:00.000+00:00',
        adoption: { id: 12, adopter: CARLOS },
    },
    {
        id: 1,
        rating: 5,
        comment: 'Max se adaptó muy rápido a nuestra casa.',
        date: '2026-09-05T00:00:00.000+00:00',
        time: '2026-09-05T10:00:00.000+00:00',
        adoption: { id: 11, adopter: LAURA },
    },
]

function renderPage(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/pets/3/reviews', state }]}>
            <Routes>
                <Route path="/pets/:petId/reviews" element={<PetReviewsPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

const asAdmin = () => getSession.mockReturnValue({ userId: 1, role: 'SHELTER_ADMIN' })
const asAdopter = () => getSession.mockReturnValue({ userId: 3, role: 'ADOPTER' })
const filter = () => screen.getByRole('combobox', { name: 'Adoptante' })

describe('PetReviewsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        asAdmin()
        getPet.mockResolvedValue({ id: 3, name: 'Max' })
        getReviews.mockResolvedValue(REVIEWS)
    })

    it('shows the pet, the average rating and the number of reviews', async () => {
        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
        expect(await screen.findByRole('heading', { name: 'Reseñas de Max' })).toBeInTheDocument()
        expect(screen.getByText('4.5')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '4.5 de 5' })).toBeInTheDocument()
        expect(screen.getByText('2 reseñas')).toBeInTheDocument()
        expect(getPet).toHaveBeenCalledWith('3')
        expect(getReviews).toHaveBeenCalledWith({ petId: '3', adopterId: '' })
    })

    it('shows every review newest first with author, date, stars and comment', async () => {
        renderPage()

        const items = await screen.findAllByRole('listitem')
        expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
            'Laura Gómez',
            'Carlos Pérez',
        ])
        expect(within(items[0]).getByText('05/09/2026')).toBeInTheDocument()
        expect(within(items[0]).getByRole('img', { name: '5 de 5' })).toBeInTheDocument()
        expect(within(items[0]).getByText('Max se adaptó muy rápido a nuestra casa.')).toBeInTheDocument()
        expect(within(items[1]).getByRole('img', { name: '4 de 5' })).toBeInTheDocument()
    })

    it('says "Adoptante" when the back-end does not send who wrote the review', async () => {
        getReviews.mockResolvedValue([{ id: 7, rating: 3, comment: 'Bien', date: '2026-09-01' }])

        renderPage()

        expect(await screen.findByRole('heading', { name: 'Adoptante' })).toBeInTheDocument()
        expect(screen.getByText('1 reseña')).toBeInTheDocument()
    })

    it('offers no way to write or edit reviews to a shelter administrator', async () => {
        renderPage()

        await screen.findAllByRole('listitem')
        expect(screen.queryByRole('link', { name: 'Escribir reseña' })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Editar mi reseña' })).not.toBeInTheDocument()
        expect(getReviews).toHaveBeenCalledTimes(1)
    })

    it('lists the adopters that wrote reviews in the filter and filters by one', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')

        const options = within(filter())
            .getAllByRole('option')
            .map((option) => option.textContent)
        expect(options).toEqual(['Todos', 'Carlos Pérez', 'Laura Gómez'])

        getReviews.mockResolvedValue([REVIEWS[0]])
        await user.selectOptions(filter(), 'Carlos Pérez')
        await user.click(screen.getByRole('button', { name: 'Buscar' }))

        await waitFor(() =>
            expect(getReviews).toHaveBeenLastCalledWith({ petId: '3', adopterId: '4' }),
        )
        expect(await screen.findByText('1 reseña')).toBeInTheDocument()
        expect(within(filter()).getAllByRole('option')).toHaveLength(3)
    })

    it('does not request anything until Buscar is pressed', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')

        await user.selectOptions(filter(), 'Carlos Pérez')

        expect(getReviews).toHaveBeenCalledTimes(1)
    })

    it('explains when the pet has no reviews', async () => {
        getReviews.mockResolvedValue([])

        renderPage()

        expect(await screen.findByText('Esta mascota aún no tiene reseñas.')).toBeInTheDocument()
        expect(screen.getByText('—')).toBeInTheDocument()
        expect(screen.getByText('0 reseñas')).toBeInTheDocument()
    })

    it('explains when the selected adopter has no reviews', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findAllByRole('listitem')
        getReviews.mockResolvedValue([])

        await user.selectOptions(filter(), 'Laura Gómez')
        await user.click(screen.getByRole('button', { name: 'Buscar' }))

        expect(
            await screen.findByText('No hay reseñas de ese adoptante para esta mascota.'),
        ).toBeInTheDocument()
    })

    it('shows the back-end error with a way back to the pet', async () => {
        getPet.mockRejectedValue(new ApiError('Pet not found', 404))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Pet not found')
        expect(screen.getByRole('link', { name: 'Volver a la mascota' })).toHaveAttribute('href', '/pets/3')
        expect(screen.getByRole('heading', { name: 'Reseñas' })).toBeInTheDocument()
    })

    describe('as an adopter', () => {
        beforeEach(asAdopter)

        it('offers "Mis reseñas" in the filter, once, and edit links on their own review', async () => {
            getReviews.mockImplementation(async ({ adopterId }) => (adopterId === 3 ? [REVIEWS[1]] : REVIEWS))

            renderPage()

            const items = await screen.findAllByRole('listitem')
            expect(await within(items[0]).findByRole('link', { name: 'Editar mi reseña' })).toHaveAttribute(
                'href',
                '/pets/3/reviews/1/edit',
            )
            expect(within(items[1]).queryByRole('link', { name: 'Editar mi reseña' })).not.toBeInTheDocument()
            const options = within(filter())
                .getAllByRole('option')
                .map((option) => option.textContent)
            expect(options).toEqual(['Todos', 'Mis reseñas', 'Carlos Pérez'])
            expect(screen.queryByRole('link', { name: 'Escribir reseña' })).not.toBeInTheDocument()
        })

        it('filters by their own reviews', async () => {
            const user = userEvent.setup()
            renderPage()
            await screen.findAllByRole('listitem')

            await user.selectOptions(filter(), 'Mis reseñas')
            await user.click(screen.getByRole('button', { name: 'Buscar' }))

            await waitFor(() =>
                expect(getReviews).toHaveBeenCalledWith({ petId: '3', adopterId: '3' }),
            )
        })

        it('offers to write a review when they have not written one', async () => {
            getReviews.mockImplementation(async ({ adopterId }) => (adopterId === 3 ? [] : REVIEWS))

            renderPage()

            expect(await screen.findByRole('link', { name: 'Escribir reseña' })).toHaveAttribute(
                'href',
                '/pets/3/reviews/new',
            )
        })

        it('does not offer anything while it is not known which reviews are theirs', async () => {
            getReviews.mockImplementation(({ adopterId }) =>
                adopterId === 3 ? new Promise(() => { }) : Promise.resolve(REVIEWS),
            )

            renderPage()

            await screen.findAllByRole('listitem')
            expect(screen.queryByRole('link', { name: 'Escribir reseña' })).not.toBeInTheDocument()
        })

        it('offers to write a review when their reviews cannot be checked', async () => {
            getReviews.mockImplementation(async ({ adopterId }) => {
                if (adopterId === 3) throw new ApiError('boom', 500)
                return REVIEWS
            })

            renderPage()

            expect(await screen.findByRole('link', { name: 'Escribir reseña' })).toBeInTheDocument()
        })
    })

    it.each([
        ['published', 'Tu reseña se publicó correctamente.'],
        ['updated', 'Tu reseña se actualizó correctamente.'],
        ['deleted', 'Tu reseña se eliminó correctamente.'],
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

    it('ignores the answers of requests that finished after leaving the page', async () => {
        asAdopter()
        let resolveRequests
        const pending = new Promise((resolve) => (resolveRequests = resolve))
        getPet.mockReturnValue(pending)
        getReviews.mockReturnValue(pending)

        const { unmount } = renderPage()
        unmount()
        resolveRequests(REVIEWS)

        await waitFor(() => expect(getReviews).toHaveBeenCalledTimes(2))
    })

    it('ignores the errors of requests that failed after leaving the page', async () => {
        asAdopter()
        let rejectRequests
        const pending = new Promise((_, reject) => (rejectRequests = reject))
        getPet.mockReturnValue(pending)
        getReviews.mockReturnValue(pending)

        const { unmount } = renderPage()
        unmount()
        rejectRequests(new Error('late'))

        await waitFor(() => expect(getReviews).toHaveBeenCalledTimes(2))
    })
})