import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import VeterinariansPage from './VeterinariansPage'
import { getVeterinarians } from '../../services/veterinarianService'

vi.mock('../../services/veterinarianService', () => ({
  getVeterinarians: vi.fn(),
  getVeterinarian: vi.fn(),
  createVeterinarian: vi.fn(),
}))

const LAURA = {
  id: 1,
  firstName: 'Laura',
  lastName: 'Gómez',
  specialization: 'Medicina general',
  availability: 'Lunes a viernes',
}
const CAMILO = {
  id: 2,
  firstName: 'Camilo',
  lastName: 'Ruiz',
  specialization: 'Cirugía',
  availability: 'Fines de semana',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <VeterinariansPage />
    </MemoryRouter>,
  )
}

describe('VeterinariansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state and then every veterinarian', async () => {
    getVeterinarians.mockResolvedValue([LAURA, CAMILO])

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    const list = await screen.findByRole('list', { name: 'Lista de veterinarios' })
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Dr(a). Laura')
    expect(cards[0]).toHaveTextContent('Gómez')
    expect(cards[0]).toHaveTextContent('Especialidad: Medicina general')
    expect(cards[0]).toHaveTextContent('Disponible: Lunes a viernes')
    expect(getVeterinarians).toHaveBeenCalledWith({ specialization: '', availability: '' })
  })

  it('links each veterinarian to their profile', async () => {
    getVeterinarians.mockResolvedValue([LAURA, CAMILO])

    renderPage()

    const links = await screen.findAllByRole('link', { name: 'Ver perfil' })
    expect(links[0]).toHaveAttribute('href', '/veterinarians/1')
    expect(links[1]).toHaveAttribute('href', '/veterinarians/2')
  })

  it('offers "Todas" plus the specializations and availabilities that exist', async () => {
    getVeterinarians.mockResolvedValue([LAURA, CAMILO])

    renderPage()

    await screen.findByRole('list', { name: 'Lista de veterinarios' })
    await waitFor(() => {
      expect(within(screen.getByLabelText('Especialización')).getAllByRole('option')).toHaveLength(3)
    })
    const availability = within(screen.getByLabelText('Disponibilidad')).getAllByRole('option')
    expect(availability.map((option) => option.textContent)).toEqual([
      'Todas',
      'Fines de semana',
      'Lunes a viernes',
    ])
  })

  it('filters by specialization and availability when searching', async () => {
    const user = userEvent.setup()
    getVeterinarians.mockResolvedValueOnce([LAURA, CAMILO]).mockResolvedValueOnce([CAMILO])

    renderPage()
    await screen.findByRole('list', { name: 'Lista de veterinarios' })
    await waitFor(() => {
      expect(within(screen.getByLabelText('Especialización')).getAllByRole('option')).toHaveLength(3)
    })

    await user.selectOptions(screen.getByLabelText('Especialización'), 'Cirugía')
    await user.selectOptions(screen.getByLabelText('Disponibilidad'), 'Fines de semana')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
    expect(screen.getByText('Dr(a). Camilo')).toBeInTheDocument()
    expect(screen.queryByText('Dr(a). Laura')).not.toBeInTheDocument()
    expect(getVeterinarians).toHaveBeenLastCalledWith({
      specialization: 'Cirugía',
      availability: 'Fines de semana',
    })
  })

  it('tells the user when no veterinarian matches the filters', async () => {
    const user = userEvent.setup()
    getVeterinarians.mockResolvedValueOnce([LAURA]).mockResolvedValueOnce([])

    renderPage()
    await screen.findByRole('list', { name: 'Lista de veterinarios' })

    await waitFor(() => {
      expect(within(screen.getByLabelText('Especialización')).getAllByRole('option')).toHaveLength(2)
    })
    await user.selectOptions(screen.getByLabelText('Especialización'), 'Medicina general')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(
      await screen.findByText('No se encontraron veterinarios con los filtros indicados.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Lista de veterinarios' })).not.toBeInTheDocument()
  })

  it('tells the user when there are no veterinarians at all', async () => {
    getVeterinarians.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Aún no hay veterinarios registrados.')).toBeInTheDocument()
  })

  it('lists everyone again when the filters go back to "Todas"', async () => {
    const user = userEvent.setup()
    getVeterinarians
      .mockResolvedValueOnce([LAURA, CAMILO])
      .mockResolvedValueOnce([CAMILO])
      .mockResolvedValueOnce([LAURA, CAMILO])

    renderPage()
    await screen.findByRole('list', { name: 'Lista de veterinarios' })
    await waitFor(() => {
      expect(within(screen.getByLabelText('Especialización')).getAllByRole('option')).toHaveLength(3)
    })
    await user.selectOptions(screen.getByLabelText('Especialización'), 'Cirugía')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })

    await user.selectOptions(screen.getByLabelText('Especialización'), 'Todas')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
    expect(getVeterinarians).toHaveBeenLastCalledWith({ specialization: '', availability: '' })
  })

  it('shows the backend message when the request fails', async () => {
    getVeterinarians.mockRejectedValue(new Error('No se pudo conectar con el servidor.'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    )
  })

  it('links to the registration form', async () => {
    getVeterinarians.mockResolvedValue([LAURA])

    renderPage()

    expect(await screen.findByRole('link', { name: 'Registrar veterinario' })).toHaveAttribute(
      'href',
      '/veterinarians/new',
    )
  })

  it('confirms a veterinarian that was just registered', async () => {
    getVeterinarians.mockResolvedValue([LAURA])

    render(
      <MemoryRouter initialEntries={[{ pathname: '/veterinarians', state: { registered: 'Camila Rojas' } }]}>
        <VeterinariansPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Veterinario/a Camila Rojas registrado/a correctamente.')).toBeInTheDocument()
  })

  it('shows no confirmation when nothing was registered', async () => {
    getVeterinarians.mockResolvedValue([LAURA])

    renderPage()

    await screen.findByRole('list', { name: 'Lista de veterinarios' })
    expect(screen.queryByText(/registrado\/a correctamente/)).not.toBeInTheDocument()
  })
})
