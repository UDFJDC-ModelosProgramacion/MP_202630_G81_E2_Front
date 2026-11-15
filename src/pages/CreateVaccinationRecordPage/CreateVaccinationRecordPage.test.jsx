import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import CreateVaccinationRecordPage from './CreateVaccinationRecordPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/roleSession'
import { getPets } from '../../services/petService'
import { createVaccinationRecord } from '../../services/vaccinationRecordService'

vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../services/vaccinationRecordService', () => ({ createVaccinationRecord: vi.fn() }))
vi.mock('../../config/roleSession', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const PETS = [
    { id: 1, name: 'Luna', vaccinationRecord: { id: 5 } },
    { id: 2, name: 'Max' },
    { id: 3, name: 'Rocky', vaccinationRecord: null },
]

function RecordStub() {
    const { state } = useLocation()
    return <p>Carnet {state?.created ? 'creado' : 'sin aviso'}</p>
}

function renderPage(entry = '/vaccination-records/new') {
    return render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="/vaccination-records/new" element={<CreateVaccinationRecordPage />} />
                <Route path="/pets/:petId/vaccination-record" element={<RecordStub />} />
                <Route path="/pets" element={<p>Listado de mascotas</p>} />
            </Routes>
        </MemoryRouter>,
    )
}

async function renderLoaded(entry) {
    renderPage(entry)
    await screen.findByRole('form', { name: 'Creación de carnet de vacunación' })
}

const pet = () => screen.getByRole('combobox', { name: 'Mascota' })
const submit = (user) => user.click(screen.getByRole('button', { name: 'Crear carnet' }))

describe('CreateVaccinationRecordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ userId: 1, role: 'SHELTER_ADMIN' })
        getPets.mockResolvedValue(PETS)
    })

    it('offers only the pets that have no vaccination record', async () => {
        await renderLoaded()

        expect(screen.getByRole('heading', { name: 'Crear carnet de vacunación' })).toBeInTheDocument()
        const options = within(pet())
            .getAllByRole('option')
            .map((option) => option.textContent)
        expect(options).toEqual(['Seleccione una mascota', 'Max', 'Rocky'])
        expect(pet()).toHaveValue('')
        expect(screen.getByText('Cada mascota solo puede tener un carnet de vacunación.')).toBeInTheDocument()
        expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
    })

    it('preselects the pet of the url when it can get a record', async () => {
        await renderLoaded('/vaccination-records/new?petId=3')

        expect(pet()).toHaveValue('3')
    })

    it('ignores a pet of the url that already has a record', async () => {
        await renderLoaded('/vaccination-records/new?petId=1')

        expect(pet()).toHaveValue('')
    })

    it('creates the record and goes to it confirmed', async () => {
        const user = userEvent.setup()
        createVaccinationRecord.mockResolvedValue({ id: 9 })
        await renderLoaded()

        await user.selectOptions(pet(), 'Max')
        await submit(user)

        expect(createVaccinationRecord).toHaveBeenCalledWith('2')
        expect(await screen.findByText('Carnet creado')).toBeInTheDocument()
    })

    it('does not send anything until a pet is selected and clears the error when it is', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await submit(user)

        expect(createVaccinationRecord).not.toHaveBeenCalled()
        expect(screen.getByText('Selecciona una mascota.')).toBeInTheDocument()
        expect(pet()).toHaveAttribute('aria-invalid', 'true')
        expect(pet()).toHaveFocus()

        await user.selectOptions(pet(), 'Max')

        expect(screen.queryByText('Selecciona una mascota.')).not.toBeInTheDocument()
    })

    it('disables the button while the record is being created', async () => {
        const user = userEvent.setup()
        createVaccinationRecord.mockReturnValue(new Promise(() => { }))
        await renderLoaded('/vaccination-records/new?petId=2')

        await submit(user)

        expect(await screen.findByText('Creando carnet...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Crear carnet' })).toBeDisabled()
    })

    it('explains an error tied to the pet and returns the focus to it', async () => {
        const user = userEvent.setup()
        createVaccinationRecord.mockRejectedValue(
            new ApiError('This pet already has a vaccination record', 412),
        )
        await renderLoaded('/vaccination-records/new?petId=2')

        await submit(user)

        const dialog = await screen.findByRole('alertdialog')
        expect(dialog).toHaveTextContent('Error al crear el carnet')
        expect(dialog).toHaveTextContent('already has a vaccination record')
        expect(pet()).toHaveAttribute('aria-invalid', 'true')
        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(pet()).toHaveFocus()
    })

    it('closes an error that is not tied to the pet without marking the field', async () => {
        const user = userEvent.setup()
        createVaccinationRecord.mockRejectedValue(new ApiError('Algo salió mal', 500))
        await renderLoaded('/vaccination-records/new?petId=2')

        await submit(user)

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Algo salió mal')
        expect(pet()).not.toHaveAttribute('aria-invalid', 'true')
        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Crear carnet' })).toBeEnabled()
    })

    it('goes to the pets from the error dialog', async () => {
        const user = userEvent.setup()
        createVaccinationRecord.mockRejectedValue(new ApiError('Pet not found', 404))
        await renderLoaded('/vaccination-records/new?petId=2')

        await submit(user)
        await user.click(await screen.findByRole('button', { name: 'Cancelar / Volver' }))

        expect(await screen.findByText('Listado de mascotas')).toBeInTheDocument()
    })

    it('tells the pets that share a name apart', async () => {
        getPets.mockResolvedValue([{ id: 2, name: 'Max' }, { id: 4, name: 'Max' }])

        await renderLoaded()

        expect(within(pet()).getByRole('option', { name: 'Max (N.º 4)' })).toBeInTheDocument()
    })

    it('explains when every pet already has a record', async () => {
        getPets.mockResolvedValue([PETS[0]])

        renderPage()

        expect(await screen.findByText('Todas las mascotas ya tienen carnet de vacunación.')).toBeInTheDocument()
        expect(screen.queryByRole('form')).not.toBeInTheDocument()
    })

    it('shows a loading state and the back-end error when the pets cannot be loaded', async () => {
        getPets.mockReturnValueOnce(new Promise(() => { }))
        const first = renderPage()
        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
        first.unmount()

        getPets.mockRejectedValue(new ApiError('No se pudo conectar', 0))
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
    })

    it('only lets a shelter administrator create records', () => {
        getSession.mockReturnValue({ userId: 7, role: 'ADOPTER' })

        renderPage()

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Solo el administrador de un refugio puede crear carnets de vacunación.',
        )
        expect(getPets).not.toHaveBeenCalled()
    })

    it('ignores the answer or the error of a request that finished after leaving the page', async () => {
        let resolveRequest
        getPets.mockReturnValueOnce(new Promise((resolve) => (resolveRequest = resolve)))
        renderPage().unmount()
        resolveRequest(PETS)

        let rejectRequest
        getPets.mockReturnValueOnce(new Promise((_, reject) => (rejectRequest = reject)))
        renderPage().unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getPets).toHaveBeenCalledTimes(2))
    })
})