import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import UpdateVeterinarianPage from './UpdateVeterinarianPage'
import { ApiError } from '../../services/apiClient'
import { getSession } from '../../config/session'
import { getVeterinarian, updateVeterinarian } from '../../services/veterinarianService'

vi.mock('../../services/veterinarianService', () => ({
    getVeterinarian: vi.fn(),
    updateVeterinarian: vi.fn(),
}))
vi.mock('../../config/session', () => ({
    ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
    getSession: vi.fn(),
}))

const VETERINARIAN = {
    id: 3,
    firstName: 'Camila',
    lastName: 'Rojas',
    email: 'camila@refugio.com',
    specialization: 'Cirugía',
    availability: 'Lunes a viernes',
}

function ProfileStub() {
    const { state } = useLocation()
    return <p>Perfil {state?.updated ? 'actualizado' : 'sin cambios'}</p>
}

function renderPage(id = '3') {
    return render(
        <MemoryRouter initialEntries={[`/veterinarians/${id}/edit`]}>
            <Routes>
                <Route path="/veterinarians/:veterinarianId/edit" element={<UpdateVeterinarianPage />} />
                <Route path="/veterinarians/:veterinarianId" element={<ProfileStub />} />
                <Route path="/veterinarians" element={<p>Listado</p>} />
            </Routes>
        </MemoryRouter>,
    )
}

const specialization = () => screen.getByRole('combobox', { name: 'Especialización' })
const availability = () => screen.getByRole('combobox', { name: 'Disponibilidad' })
const save = (user) => user.click(screen.getByRole('button', { name: 'Guardar' }))

async function renderLoaded(veterinarian = VETERINARIAN) {
    getVeterinarian.mockResolvedValue(veterinarian)
    renderPage()
    await screen.findByRole('heading', { name: 'Actualizar veterinario' })
    await screen.findByRole('form', { name: 'Actualización de veterinario' })
}

describe('UpdateVeterinarianPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getSession.mockReturnValue({ role: 'SHELTER_ADMIN', userId: 7, name: 'AdminUser' })
    })

    it('loads the veterinarian and shows their current data', async () => {
        await renderLoaded()

        expect(getVeterinarian).toHaveBeenCalledWith('3')
        expect(screen.getByRole('textbox', { name: 'Veterinario' })).toHaveValue('Camila Rojas')
        expect(screen.getByRole('textbox', { name: 'Veterinario' })).toHaveAttribute('readonly')
        expect(specialization()).toHaveValue('Cirugía')
        expect(availability()).toHaveValue('Lunes a viernes')
        expect(
            screen.getByText('Solo se pueden modificar la especialización y la disponibilidad.'),
        ).toBeInTheDocument()
        expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
    })

    it('shows a loading state while the veterinarian is requested', () => {
        getVeterinarian.mockReturnValue(new Promise(() => { }))

        renderPage()

        expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    })

    it('shows the backend error and a way back when the veterinarian cannot be loaded', async () => {
        getVeterinarian.mockRejectedValue(new Error('Veterinarian not found'))

        renderPage('999')

        expect(await screen.findByRole('alert')).toHaveTextContent('Veterinarian not found')
        expect(screen.getByRole('link', { name: 'Volver al listado' })).toHaveAttribute(
            'href',
            '/veterinarians',
        )
    })

    it('does not apply the answer of a request that finished after leaving the page', async () => {
        let resolveRequest
        getVeterinarian.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)))

        const { unmount } = renderPage()
        unmount()
        resolveRequest(VETERINARIAN)

        await waitFor(() => expect(getVeterinarian).toHaveBeenCalledTimes(1))
    })

    it('does not apply the error of a request that failed after leaving the page', async () => {
        let rejectRequest
        getVeterinarian.mockReturnValue(new Promise((_, reject) => (rejectRequest = reject)))

        const { unmount } = renderPage()
        unmount()
        rejectRequest(new Error('late'))

        await waitFor(() => expect(getVeterinarian).toHaveBeenCalledTimes(1))
    })

    it('only lets a shelter administrator update veterinarians', () => {
        getSession.mockReturnValue({ role: 'ADOPTER' })

        renderPage()

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Solo el administrador de un refugio puede actualizar veterinarios.',
        )
        expect(getVeterinarian).not.toHaveBeenCalled()
    })

    it('shows an empty selection when the veterinarian has no saved values', async () => {
        await renderLoaded({ ...VETERINARIAN, specialization: null, availability: undefined })

        expect(specialization()).toHaveValue('')
        expect(availability()).toHaveValue('')
    })

    it('keeps a saved value that is not a standard option', async () => {
        await renderLoaded({ ...VETERINARIAN, specialization: 'Neurología' })

        expect(specialization()).toHaveValue('Neurología')
        expect(screen.getByRole('option', { name: 'Neurología' })).toBeInTheDocument()
    })

    it('saves only the specialization and availability and shows the profile confirmed', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockResolvedValue({ ...VETERINARIAN, specialization: 'Dermatología' })
        await renderLoaded()

        await user.selectOptions(specialization(), 'Dermatología')
        await user.selectOptions(availability(), 'Fines de semana')
        await save(user)

        expect(updateVeterinarian).toHaveBeenCalledWith(3, {
            specialization: 'Dermatología',
            availability: 'Fines de semana',
        })
        expect(await screen.findByText('Perfil actualizado')).toBeInTheDocument()
    })

    it('blocks the request and marks both fields when they are emptied', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.selectOptions(specialization(), '')
        await user.selectOptions(availability(), '')
        await save(user)

        expect(updateVeterinarian).not.toHaveBeenCalled()
        expect(screen.getByText('Selecciona una especialización.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona una disponibilidad.')).toBeInTheDocument()
        expect(specialization()).toHaveAttribute('aria-invalid', 'true')
        expect(specialization()).toHaveFocus()
    })

    it('focuses the availability when it is the only invalid field', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.selectOptions(availability(), '')
        await save(user)

        expect(screen.queryByText('Selecciona una especialización.')).not.toBeInTheDocument()
        expect(availability()).toHaveFocus()
    })

    it('clears the error of a field as soon as it is corrected', async () => {
        const user = userEvent.setup()
        await renderLoaded()
        await user.selectOptions(specialization(), '')
        await save(user)

        await user.selectOptions(specialization(), 'Cardiología')

        expect(screen.queryByText('Selecciona una especialización.')).not.toBeInTheDocument()
        expect(specialization()).toHaveValue('Cardiología')
    })

    it('explains a backend error tied to a field and returns the focus to it', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockRejectedValue(
            new ApiError('Availability cannot be null or empty', 412),
        )
        await renderLoaded()

        await save(user)

        const dialog = await screen.findByRole('alertdialog')
        expect(dialog).toHaveTextContent('Availability cannot be null or empty')
        expect(dialog).toHaveTextContent('Error 412')
        expect(availability()).toHaveAttribute('aria-invalid', 'true')

        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(availability()).toHaveFocus()
    })

    it('shows a backend error of the specialization on that field', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockRejectedValue(
            new ApiError('Specialization cannot be null or empty', 412),
        )
        await renderLoaded()

        await save(user)
        await user.click(await screen.findByRole('button', { name: 'Modificar datos' }))

        expect(specialization()).toHaveFocus()
    })

    it('closes a backend error that is not tied to a field without moving the focus', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockRejectedValue(new ApiError('Veterinarian not found', 404))
        await renderLoaded()

        await save(user)

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('Error 404')
        expect(specialization()).not.toHaveAttribute('aria-invalid', 'true')
        await user.click(screen.getByRole('button', { name: 'Modificar datos' }))

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('goes back to the list from the error dialog', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockRejectedValue(new ApiError('Veterinarian not found', 404))
        await renderLoaded()

        await save(user)
        await user.click(await screen.findByRole('button', { name: 'Cancelar / Volver' }))

        expect(await screen.findByText('Listado')).toBeInTheDocument()
    })

    it('disables saving while the request is in progress', async () => {
        const user = userEvent.setup()
        updateVeterinarian.mockReturnValue(new Promise(() => { }))
        await renderLoaded()

        await save(user)

        expect(await screen.findByText('Guardando cambios...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })

    it('goes back to the profile without saving when cancelled', async () => {
        const user = userEvent.setup()
        await renderLoaded()

        await user.click(screen.getByRole('button', { name: 'Cancelar' }))

        expect(await screen.findByText('Perfil sin cambios')).toBeInTheDocument()
        expect(updateVeterinarian).not.toHaveBeenCalled()
    })
})