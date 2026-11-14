import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import RegisterVeterinarianPage from './RegisterVeterinarianPage'
import { createVeterinarian } from '../../services/veterinarianService'

vi.mock('../../services/veterinarianService', () => ({
    getVeterinarians: vi.fn(),
    getVeterinarian: vi.fn(),
    createVeterinarian: vi.fn(),
}))

function VeterinariansStub() {
    const { state } = useLocation()
    return <h1>Listado: {state?.registered}</h1>
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/veterinarians/new']}>
            <Routes>
                <Route path="/veterinarians/new" element={<RegisterVeterinarianPage />} />
                <Route path="/veterinarians" element={<VeterinariansStub />} />
            </Routes>
        </MemoryRouter>,
    )
}

async function fillForm(user, overrides = {}) {
    const values = {
        firstName: 'Camila',
        lastName: 'Rojas',
        email: 'camila@refugio.com',
        phone: '300 123 4567',
        specialization: 'Cirugía',
        availability: 'Lunes a viernes',
        ...overrides,
    }
    if (values.firstName) await user.type(screen.getByLabelText(/^Nombre/), values.firstName)
    if (values.lastName) await user.type(screen.getByLabelText(/^Apellido/), values.lastName)
    if (values.email) await user.type(screen.getByLabelText(/^Correo/), values.email)
    if (values.phone) await user.type(screen.getByLabelText(/^Teléfono/), values.phone)
    if (values.specialization) {
        await user.selectOptions(screen.getByLabelText(/^Especialización/), values.specialization)
    }
    if (values.availability) {
        await user.selectOptions(screen.getByLabelText(/^Disponibilidad/), values.availability)
    }
}

const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar' }))

describe('RegisterVeterinarianPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the registration form with every field marked as required', () => {
        renderPage()

        expect(screen.getByRole('heading', { name: 'Registre un veterinario' })).toBeInTheDocument()
        for (const label of [/^Nombre/, /^Apellido/, /^Correo/, /^Teléfono/, /^Especialización/, /^Disponibilidad/]) {
            expect(screen.getByLabelText(label)).toBeInTheDocument()
        }
        expect(screen.getAllByText('*')).toHaveLength(6)
        expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
        expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/veterinarians')
    })

    it('offers the specializations and availabilities in the selects', () => {
        renderPage()

        const specializations = within(screen.getByLabelText(/^Especialización/)).getAllByRole('option')
        expect(specializations.map((option) => option.textContent)).toEqual([
            'Seleccione',
            'Cardiología',
            'Cirugía',
            'Dermatología',
            'Medicina general',
            'Oftalmología',
        ])
        const availabilities = within(screen.getByLabelText(/^Disponibilidad/)).getAllByRole('option')
        expect(availabilities).toHaveLength(6)
        expect(availabilities[0]).toHaveTextContent('Seleccione')
        expect(availabilities[4]).toHaveTextContent('Lunes a viernes')
    })

    it('shows one message per missing field and does not call the backend', async () => {
        const user = userEvent.setup()
        renderPage()

        await submit(user)

        expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
        expect(screen.getByText('El apellido es obligatorio.')).toBeInTheDocument()
        expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
        expect(screen.getByText('El teléfono es obligatorio.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona una especialización.')).toBeInTheDocument()
        expect(screen.getByText('Selecciona una disponibilidad.')).toBeInTheDocument()
        expect(screen.getByLabelText(/^Nombre/)).toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByLabelText(/^Nombre/)).toHaveAccessibleDescription('El nombre es obligatorio.')
        expect(createVeterinarian).not.toHaveBeenCalled()
    })

    it('reports only the field that is missing', async () => {
        const user = userEvent.setup()
        renderPage()

        await fillForm(user, { lastName: '' })
        await submit(user)

        expect(screen.getByText('El apellido es obligatorio.')).toBeInTheDocument()
        expect(screen.queryByText('El nombre es obligatorio.')).not.toBeInTheDocument()
        expect(screen.getByLabelText(/^Nombre/)).not.toHaveAttribute('aria-invalid')
        expect(createVeterinarian).not.toHaveBeenCalled()
    })

    it('rejects an invalid e-mail and an invalid phone', async () => {
        const user = userEvent.setup()
        renderPage()

        await fillForm(user, { email: 'camila-sin-arroba', phone: '123' })
        await submit(user)

        expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
        expect(screen.getByText('Ingresa un teléfono válido (entre 7 y 15 dígitos).')).toBeInTheDocument()
        expect(createVeterinarian).not.toHaveBeenCalled()
    })

    it('clears the message of a field as soon as the user edits it', async () => {
        const user = userEvent.setup()
        renderPage()
        await submit(user)
        expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()

        await user.type(screen.getByLabelText(/^Nombre/), 'C')

        expect(screen.queryByText('El nombre es obligatorio.')).not.toBeInTheDocument()
        expect(screen.getByText('El apellido es obligatorio.')).toBeInTheDocument()
    })

    it('registers the veterinarian and goes back to the list with a confirmation', async () => {
        const user = userEvent.setup()
        createVeterinarian.mockResolvedValue({ id: 5 })
        renderPage()

        await fillForm(user, { firstName: '  Camila ', phone: '300 123 4567 ' })
        await submit(user)

        expect(
            await screen.findByRole('heading', { name: 'Listado: Camila Rojas' }),
        ).toBeInTheDocument()
        expect(createVeterinarian).toHaveBeenCalledTimes(1)
        expect(createVeterinarian).toHaveBeenCalledWith({
            firstName: 'Camila',
            lastName: 'Rojas',
            email: 'camila@refugio.com',
            phone: '300 123 4567',
            specialization: 'Cirugía',
            availability: 'Lunes a viernes',
        })
    })

    it('disables the button while the veterinarian is being registered', async () => {
        const user = userEvent.setup()
        let finish
        createVeterinarian.mockReturnValue(
            new Promise((resolve) => {
                finish = resolve
            }),
        )
        renderPage()

        await fillForm(user)
        await submit(user)

        const button = screen.getByRole('button', { name: 'Registrando...' })
        expect(button).toBeDisabled()

        finish({ id: 5 })
        expect(await screen.findByRole('heading', { name: /^Listado/ })).toBeInTheDocument()
    })

    it('shows the backend message and keeps what the user typed when the e-mail is taken', async () => {
        const user = userEvent.setup()
        createVeterinarian.mockRejectedValue(
            new Error('Two veterinarians cannot be associated with the same user; this user already exists'),
        )
        renderPage()

        await fillForm(user)
        await submit(user)

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Two veterinarians cannot be associated with the same user; this user already exists',
        )
        expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Camila')
        expect(screen.getByLabelText(/^Correo/)).toHaveValue('camila@refugio.com')
        expect(screen.getByLabelText(/^Especialización/)).toHaveValue('Cirugía')
        expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
    })

    it('shows the shelter error sent by the backend', async () => {
        const user = userEvent.setup()
        createVeterinarian.mockRejectedValue(new Error('The shelter must be an existing shelter'))
        renderPage()

        await fillForm(user)
        await submit(user)

        expect(await screen.findByRole('alert')).toHaveTextContent('The shelter must be an existing shelter')
    })

    it('removes the previous backend error when the form is sent again', async () => {
        const user = userEvent.setup()
        createVeterinarian
            .mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'))
            .mockResolvedValueOnce({ id: 5 })
        renderPage()

        await fillForm(user)
        await submit(user)
        expect(await screen.findByRole('alert')).toBeInTheDocument()

        await submit(user)

        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        })
        expect(await screen.findByRole('heading', { name: 'Listado: Camila Rojas' })).toBeInTheDocument()
        expect(createVeterinarian).toHaveBeenCalledTimes(2)
    })
})