import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ShelterListPage from './ShelterListPage'
import { getShelters } from '../../services/shelterService'

vi.mock('../../services/shelterService', () => ({
  getShelters: vi.fn(),
}))

const PATITAS = {
  id: 1,
  name: 'Patitas Felices',
  city: 'Bogotá',
  nit: '900.069.803-1',
  location: 'Carrera 15 # 85 - 32',
}
const HUELLAS = {
  id: 2,
  name: 'Huellas de Esperanza',
  city: 'Medellín',
  nit: '800.231.984-7',
  location: 'Carrera 70 # 32B-15',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ShelterListPage />
    </MemoryRouter>,
  )
}

async function waitForList() {
  return screen.findByRole('list', { name: 'Lista de refugios' })
}

describe('ShelterListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state and then the name, city and location of every shelter', async () => {
    getShelters.mockResolvedValue([PATITAS, HUELLAS])

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
    const cards = within(await waitForList()).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Patitas Felices')
    expect(cards[0]).toHaveTextContent('CiudadBogotá')
    expect(cards[0]).toHaveTextContent('DirecciónCarrera 15 # 85 - 32')
    expect(getShelters).toHaveBeenCalledWith({ city: '', location: '' })
  })

  it('opens the shelter detail when a shelter is selected', async () => {
    getShelters.mockResolvedValue([PATITAS, HUELLAS])

    renderPage()
    await waitForList()

    expect(screen.getByRole('link', { name: 'Patitas Felices' })).toHaveAttribute(
      'href',
      '/shelters/1',
    )
    expect(screen.getByRole('link', { name: 'Huellas de Esperanza' })).toHaveAttribute(
      'href',
      '/shelters/2',
    )
  })

  it('explains that the search is an exact match that ignores case', async () => {
    getShelters.mockResolvedValue([PATITAS])

    renderPage()
    await waitForList()

    expect(screen.getByText(/compara el texto exacto, sin distinguir mayúsculas/)).toBeInTheDocument()
    expect(screen.getByLabelText('Dirección')).toHaveAccessibleDescription(
      /compara el texto exacto/,
    )
  })

  it('offers the known cities plus any other city that has a shelter', async () => {
    getShelters.mockResolvedValue([{ ...PATITAS, city: 'Tunja' }])

    renderPage()
    await waitForList()

    await waitFor(() => {
      const options = within(screen.getByLabelText('Ciudad')).getAllByRole('option')
      expect(options.map((option) => option.textContent)).toContain('Tunja')
    })
    const options = within(screen.getByLabelText('Ciudad')).getAllByRole('option')
    expect(options[0]).toHaveTextContent('Todas')
    expect(options.map((option) => option.textContent)).toContain('Bogotá')
  })

  it('combines the city and location filters when searching', async () => {
    const user = userEvent.setup()
    getShelters.mockResolvedValueOnce([PATITAS, HUELLAS]).mockResolvedValueOnce([HUELLAS])

    renderPage()
    await waitForList()

    await user.selectOptions(screen.getByLabelText('Ciudad'), 'Medellín')
    await user.type(screen.getByLabelText('Dirección'), 'Carrera 70 # 32B-15')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
    expect(screen.getByText('Huellas de Esperanza')).toBeInTheDocument()
    expect(screen.queryByText('Patitas Felices')).not.toBeInTheDocument()
    expect(getShelters).toHaveBeenLastCalledWith({
      city: 'Medellín',
      location: 'Carrera 70 # 32B-15',
    })
  })

  it('tells the user when there are no registered shelters', async () => {
    getShelters.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Aún no hay refugios registrados')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Lista de refugios' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Limpiar filtros' })).toHaveLength(1)
  })

  it('tells the user when the filters match no shelter and offers to clear them', async () => {
    const user = userEvent.setup()
    getShelters.mockResolvedValueOnce([PATITAS]).mockResolvedValueOnce([])

    renderPage()
    await waitForList()

    await user.type(screen.getByLabelText('Dirección'), 'Calle 1')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    const message = await screen.findByText('No se encontraron refugios con esos filtros')
    expect(message).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay refugios registrados')).not.toBeInTheDocument()
    const empty = screen.getByRole('status')
    expect(within(empty).getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument()
  })

  it('lists every shelter again when the filters are cleared from the empty state', async () => {
    const user = userEvent.setup()
    getShelters
      .mockResolvedValueOnce([PATITAS])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([PATITAS])

    renderPage()
    await waitForList()
    await user.type(screen.getByLabelText('Dirección'), 'Calle 1')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    const empty = await screen.findByRole('status')

    await user.click(within(empty).getByRole('button', { name: 'Limpiar filtros' }))

    expect(await waitForList()).toBeInTheDocument()
    expect(screen.getByLabelText('Dirección')).toHaveValue('')
    expect(screen.getByLabelText('Ciudad')).toHaveValue('')
    expect(getShelters).toHaveBeenLastCalledWith({ city: '', location: '' })
  })

  it('clears the filters with the button next to the filters', async () => {
    const user = userEvent.setup()
    getShelters.mockResolvedValue([PATITAS])

    renderPage()
    await waitForList()
    await user.selectOptions(screen.getByLabelText('Ciudad'), 'Bogotá')

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await waitForList()
    expect(screen.getByLabelText('Ciudad')).toHaveValue('')
    expect(getShelters).toHaveBeenLastCalledWith({ city: '', location: '' })
  })

  it('shows the backend message when the request fails', async () => {
    getShelters.mockRejectedValue(new Error('No se pudo conectar con el servidor.'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    )
  })

  describe('when answers arrive out of order', () => {
    function deferred() {
      const control = {}
      control.promise = new Promise((resolve, reject) => {
        control.resolve = resolve
        control.reject = reject
      })
      return control
    }

    async function searchWhileFirstRequestIsPending(first, second) {
      const user = userEvent.setup()
      getShelters.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      renderPage()
      await user.type(screen.getByLabelText('Dirección'), 'Calle 1')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))
      await waitFor(() => expect(getShelters).toHaveBeenCalledTimes(2))
    }

    it('ignores an older answer that arrives after the latest one', async () => {
      const first = deferred()
      const second = deferred()
      await searchWhileFirstRequestIsPending(first, second)

      await act(async () => second.resolve([HUELLAS]))
      await act(async () => first.resolve([PATITAS]))

      expect(await waitForList()).toHaveTextContent('Huellas de Esperanza')
      expect(screen.queryByText('Patitas Felices')).not.toBeInTheDocument()
    })

    it('ignores the error of an older request that arrives after the latest answer', async () => {
      const first = deferred()
      const second = deferred()
      await searchWhileFirstRequestIsPending(first, second)

      await act(async () => second.resolve([HUELLAS]))
      await act(async () => first.reject(new Error('Respuesta vieja con error')))

      expect(await waitForList()).toHaveTextContent('Huellas de Esperanza')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})