import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetVaccinationRecordPage from './PetVaccinationRecordPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import {
    deleteVaccinationRecord,
    getVaccinationRecordByPet,
} from '../../services/vaccinationRecordService'

vi.mock('../../services/vaccinationRecordService', () => ({
    getVaccinationRecordByPet: vi.fn(),
    deleteVaccinationRecord: vi.fn(),
}))
vi.mock('../../config/roleSession', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const RECORD = {
    id: 8,
    pet: { id: 3, name: 'Max' },
    vaccines: [
        { id: 4, name: 'Hepatitis canina', status: false, nextAdministration: '2026-11-20T00:00:00.000+00:00' },
        {
            id: 2,
            name: 'Parvovirus',
            status: true,
            administrationDate: '2026-01-10T00:00:00.000+00:00',
            nextAdministration: '2026-07-10T00:00:00.000+00:00',
        },
        {
            id: 1,
            name: 'Rabia',
            status: true,
            administrationDate: '2026-01-09T00:00:00.000+00:00',
            nextAdministration: '2027-01-10T00:00:00.000+00:00',
        },
    ],
}

function renderPage(state) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/pets/3/vaccination-record', state }]}>
            <Routes>
                <Route path="/pets/:petId/vaccination-record" element={<PetVaccinationRecordPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

const asAdmin = () => getSession.mockReturnValue({ userId: 1, role: 'SHELTER_ADMIN' })
const asAdopter = () => getSession.mockReturnValue({ userId: 7, role: 'ADOPTER' })

describe('PetVaccinationRecordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        asAdmin()
        getVaccinationRecordByPet.mockResolvedValue(RECORD)
    })

    it('shows the pet, the record number and the vaccines', async () => {
        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
        expect(await screen.findByRole('heading', { name: 'Carnet de vacunación' })).toBeInTheDocument()
        expect(await screen.findByText('Max')).toBeInTheDocument()
        expect(screen.getByText('Carnet No. 8')).toBeInTheDocument()
        expect(getVaccinationRecordByPet).toHaveBeenCalledWith('3')
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
            'Vacuna',
            'Aplicación',
            'Próxima dosis',
            'Estado',
        ])
    })

    it('lists the applied vaccines first and then the pending ones, with their dates and status', async () => {
        renderPage()

        const rows = (await screen.findAllByRole('row')).slice(1)
        expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
            'Rabia',
            'Parvovirus',
            'Hepatitis canina',
        ])
        const cells = (row) => within(row).getAllByRole('cell').map((cell) => cell.textContent)
        expect(cells(rows[0])).toEqual(['09/01/2026', '10/01/2027', 'Aplicada'])
        expect(cells(rows[2])).toEqual(['—', '20/11/2026', 'Pendiente'])
    })

    it('explains when the record has no vaccines or the answer has no list', async () => {
        getVaccinationRecordByPet.mockResolvedValue({ id: 8, pet: { name: 'Max' } })

        renderPage()

        expect(await screen.findByText('Este carnet aún no tiene vacunas registradas.')).toBeInTheDocument()
    })

    it('shows a dash when the record does not say which pet it belongs to', async () => {
        getVaccinationRecordByPet.mockResolvedValue({ id: 8, vaccines: [] })

        renderPage()

        expect(await screen.findByText('—')).toBeInTheDocument()
    })

    it('does not offer to delete the record to users who are not shelter administrators', async () => {
        asAdopter()

        renderPage()

        await screen.findByText('Carnet No. 8')
        expect(screen.queryByRole('button', { name: 'Eliminar carnet' })).not.toBeInTheDocument()
    })

    it('tells a pet without record, and offers the administrator to create it', async () => {
        getVaccinationRecordByPet.mockRejectedValue(
            new ApiError('Vaccination record not found for that pet', 404),
        )

        renderPage()

        expect(await screen.findByText('Esta mascota todavía no tiene carnet de vacunación.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Crear carnet de vacunación' })).toHaveAttribute(
            'href',
            '/vaccination-records/new?petId=3',
        )
    })

    it('does not offer to create the record to users who are not shelter administrators', async () => {
        asAdopter()
        getVaccinationRecordByPet.mockRejectedValue(new ApiError('not found', 404))

        renderPage()

        await screen.findByText('Esta mascota todavía no tiene carnet de vacunación.')
        expect(screen.queryByRole('link', { name: 'Crear carnet de vacunación' })).not.toBeInTheDocument()
    })

    it('shows any other back-end error with a way back to the pet', async () => {
        getVaccinationRecordByPet.mockRejectedValue(new ApiError('No se pudo conectar', 0))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
        expect(screen.getByRole('link', { name: 'Volver a la mascota' })).toHaveAttribute('href', '/pets/3')
    })

    it('confirms that the record was created when arriving from the creation form', async () => {
        renderPage({ created: true })

        await screen.findByText('Carnet No. 8')
        expect(screen.getByRole('status')).toHaveTextContent('El carnet de vacunación se creó correctamente.')
    })

    it('does not show a confirmation on a normal visit', async () => {
        renderPage()

        await screen.findByText('Carnet No. 8')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    describe('deleting the record', () => {
        const openConfirmation = async (user) => {
            await user.click(await screen.findByRole('button', { name: 'Eliminar carnet' }))
            return screen.findByRole('alertdialog')
        }

        it('asks for confirmation naming the pet and does nothing when the user cancels', async () => {
            const user = userEvent.setup()
            renderPage()

            const dialog = await openConfirmation(user)
            expect(dialog).toHaveTextContent('¿Eliminar carnet de vacunación?')
            expect(dialog).toHaveTextContent('Se eliminará de forma permanente el carnet de Max.')
            expect(dialog).toHaveTextContent('Solo es posible cuando la mascota ya fue adoptada.')
            await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(deleteVaccinationRecord).not.toHaveBeenCalled()
        })

        it('deletes the record once the user confirms and offers to create a new one', async () => {
            const user = userEvent.setup()
            deleteVaccinationRecord.mockResolvedValue(null)
            renderPage({ created: true })

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            expect(deleteVaccinationRecord).toHaveBeenCalledWith(8)
            expect(await screen.findByText('El carnet de vacunación se eliminó correctamente.')).toBeInTheDocument()
            expect(screen.queryByText('El carnet de vacunación se creó correctamente.')).not.toBeInTheDocument()
            expect(screen.queryByRole('table')).not.toBeInTheDocument()
            expect(screen.getByRole('link', { name: 'Crear carnet de vacunación' })).toBeInTheDocument()
        })

        it('shows progress while the record is being deleted', async () => {
            const user = userEvent.setup()
            deleteVaccinationRecord.mockReturnValue(new Promise(() => { }))
            renderPage()

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            expect(await screen.findByText('Eliminando...')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Eliminar carnet' })).toBeDisabled()
        })

        it('explains why the record could not be deleted and keeps it', async () => {
            const user = userEvent.setup()
            deleteVaccinationRecord.mockRejectedValue(
                new ApiError('Vaccination record cannot be deleted while the pet is still active in the shelter', 412),
            )
            renderPage()

            const dialog = await openConfirmation(user)
            await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

            const errorDialog = await screen.findByRole('alertdialog')
            expect(errorDialog).toHaveTextContent('Error al eliminar el carnet')
            expect(errorDialog).toHaveTextContent('still active in the shelter')
            await user.click(screen.getByRole('button', { name: 'Entendido' }))

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(screen.getByRole('table')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Eliminar carnet' })).toBeEnabled()
        })
    })

    it('ignores the answer or the error of a request that finished after leaving the page', async () => {
        let resolveRequest
        getVaccinationRecordByPet.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)))
        renderPage().unmount()
        resolveRequest(RECORD)

        let rejectRequest
        getVaccinationRecordByPet.mockReturnValueOnce(new Promise((_, reject) => (rejectRequest = reject)))
        renderPage().unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getVaccinationRecordByPet).toHaveBeenCalledTimes(2))
    })
})