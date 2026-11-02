import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdoptersPage from './AdoptersPage'
import { getSession } from '../../config/adopterSession'
import { getAdopters } from '../../services/adopterService'

vi.mock('../../services/adopterService', () => ({ getAdopters: vi.fn() }))
vi.mock('../../config/adopterSession', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

const adopters = [
  {
    id: 2,
    firstName: 'Zoe',
    lastName: 'Ramírez',
    nationalId: '2002',
    housingType: 'Casa',
    occupation: 'Docente',
  },
  {
    id: 1,
    firstName: 'Ana',
    lastName: 'Gómez',
    nationalId: '1001',
    housingType: 'Apartamento',
    occupation: 'Ingeniera',
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/adopters']}>
      <Routes>
        <Route path="/adopters" element={<AdoptersPage />} />
        <Route path="/adopters/:adopterId" element={<p>Detalle</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ role: 'SHELTER_ADMIN' })
  vi.mocked(getAdopters).mockReset()
  vi.mocked(getAdopters).mockResolvedValue(adopters)
})

describe('AdoptersPage', () => {
  it('lists adopters sorted by name with their data and a detail link', async () => {
    renderPage()

    const headings = await screen.findAllByRole('heading', { level: 2 })
    expect(headings.map((heading) => heading.textContent)).toEqual(['Ana Gómez', 'Zoe Ramírez'])
    expect(screen.getByText('Cédula: 1001')).toBeInTheDocument()
    expect(screen.getByText('Vivienda: Apartamento')).toBeInTheDocument()
    expect(screen.getByText('Ocupación: Ingeniera')).toBeInTheDocument()
    const detailLinks = screen.getAllByRole('link', { name: 'Ver detalle' })
    expect(detailLinks[0]).toHaveAttribute('href', '/adopters/1')
    expect(detailLinks[1]).toHaveAttribute('href', '/adopters/2')
    expect(getAdopters).toHaveBeenCalledWith({ nationalId: '', housingType: '', occupation: '' })
  })

  it('shows the empty message when there are no adopters', async () => {
    vi.mocked(getAdopters).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Aún no hay adoptantes registrados.')).toBeInTheDocument()
  })

  it('sends only the filled filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByRole('heading', { level: 2 })

    await user.type(screen.getByLabelText('Cédula'), '1001')
    await user.selectOptions(screen.getByLabelText('Tipo de vivienda'), 'Casa')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(getAdopters).toHaveBeenLastCalledWith({
      nationalId: '1001',
      housingType: 'Casa',
      occupation: '',
    })
  })

  it('offers a clear button in the filtered empty state and reloads all adopters', async () => {
    const user = userEvent.setup()
    vi.mocked(getAdopters)
      .mockResolvedValueOnce(adopters)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(adopters)
    renderPage()
    await screen.findAllByRole('heading', { level: 2 })

    await user.type(screen.getByLabelText('Cédula'), '999')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(
      await screen.findByText('No se encontraron adoptantes con los filtros indicados.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(getAdopters).toHaveBeenLastCalledWith({
      nationalId: '',
      housingType: '',
      occupation: '',
    })
    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
  })

  it('shows the backend message when the query fails', async () => {
    vi.mocked(getAdopters).mockRejectedValue(new Error('Search filters cannot be empty'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Search filters cannot be empty')
  })

  it('blocks roles other than the shelter administrator', async () => {
    vi.mocked(getSession).mockReturnValue({ role: 'ADOPTER' })
    renderPage()

    expect(
      screen.getByText('Solo el administrador del refugio puede consultar los adoptantes.'),
    ).toBeInTheDocument()
    expect(getAdopters).not.toHaveBeenCalled()
  })
})
