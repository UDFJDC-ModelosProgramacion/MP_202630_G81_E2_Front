import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PetsPage from './PetsPage'
import { getPets } from '../../services/petService'
import { getSession, ROLES } from '../../config/session'

vi.mock('../../services/petService', () => ({ getPets: vi.fn() }))
vi.mock('../../config/session', () => ({
  getSession: vi.fn(),
  ROLES: { ADMIN: 'ADMIN', SHELTER_ADMIN: 'SHELTER_ADMIN' },
}))

const PETS = [
  {
    id: 1,
    name: 'Luna',
    species: 'Perro',
    breed: 'Criollo',
    age: 2,
    sex: 'Hembra',
    size: 'Mediano',
    requiredSpace: 'Casa',
    compatibilityChildren: true,
    compatibilityOtherPets: false,
    activityLevel: 'Alto',
    shelter: { name: 'Huellas felices', city: 'Bogotá' },
  },
  {
    id: 2,
    name: 'Milo',
    species: 'Gato',
    breed: 'Europeo',
    age: 1,
    sex: 'Macho',
    size: 'Pequeño',
    requiredSpace: 'Apartamento',
    compatibilityChildren: false,
    compatibilityOtherPets: true,
    activityLevel: 'Bajo',
    shelter: { name: 'Patitas', city: 'Cali' },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets']}>
      <Routes>
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/:petId" element={<p>Perfil de mascota</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('PetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: ROLES.ADMIN })
    getPets.mockResolvedValue(PETS)
  })

  it('lists pets with profile links and an administrator registration action', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Mascotas que buscan un hogar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conocer a Luna' })).toHaveAttribute('href', '/pets/1')
    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute('href', '/pets/new')
  })

  it('filters by text and select criteria, and can clear all filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Luna' })

    await user.selectOptions(screen.getByLabelText('Especie'), 'Gato')
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o raza' }), 'desconocido')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver todas las mascotas' }))
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
  })

  it('filters by sex, size and case-insensitive text, then clears the filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Luna' })

    await user.selectOptions(screen.getByLabelText('Sexo'), 'Hembra')
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Milo' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Sexo'), '')
    await user.selectOptions(screen.getByLabelText('Tamaño'), 'Pequeño')
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Tamaño'), '')
    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o raza' }), 'EUROPEO')
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
  })

  it('combines exact age, space, compatibility, and activity filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Luna' })

    expect(screen.getByLabelText('Compatible con niños')).toHaveValue('')
    expect(screen.getByLabelText('Compatible con otras mascotas')).toHaveValue('')

    await user.type(screen.getByLabelText('Edad exacta'), '1')
    await user.selectOptions(screen.getByLabelText('Espacio requerido'), 'Apartamento')
    await user.selectOptions(screen.getByLabelText('Compatible con niños'), 'false')
    await user.selectOptions(screen.getByLabelText('Compatible con otras mascotas'), 'true')
    await user.selectOptions(screen.getByLabelText('Nivel de actividad'), 'Bajo')

    expect(screen.getByRole('heading', { name: 'Milo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Luna' })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Edad exacta'))
    await user.type(screen.getByLabelText('Edad exacta'), '2')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
  })

  it('shows the pet age, compatibility, and shelter city on each card', async () => {
    renderPage()

    const pets = within(await screen.findByRole('list', { name: 'Mascotas disponibles' }))
    const [luna] = pets.getAllByRole('listitem')

    expect(luna).toHaveTextContent('2 años')
    expect(luna).toHaveTextContent('Niños: Sí')
    expect(luna).toHaveTextContent('Otras mascotas: No')
    expect(luna).toHaveTextContent('Huellas felices · Bogotá')
  })

  it('shows pet descriptions and replaces broken or missing photos with the placeholder', async () => {
    getPets.mockResolvedValue([
      {
        ...PETS[0],
        photos: [{ url: 'https://example.test/luna.jpg' }],
        description: 'Muy cariñosa',
      },
      { ...PETS[1], photos: [null, { url: '' }] },
    ])
    renderPage()

    const rows = within(await screen.findByRole('list', { name: 'Mascotas disponibles' })).getAllByRole('listitem')
    expect(within(rows[0]).getByText('Muy cariñosa')).toBeInTheDocument()

    const image = rows[0].querySelector('img')
    expect(image).toHaveAttribute('src', 'https://example.test/luna.jpg')
    fireEvent.error(image)

    expect(rows[0].querySelector('img')).not.toBeInTheDocument()
    expect(rows[0].querySelector('svg')).toBeInTheDocument()
    expect(rows[1].querySelector('img')).not.toBeInTheDocument()
    expect(rows[1].querySelector('svg')).toBeInTheDocument()
  })

  it('handles incomplete pet details and safely filters missing values', async () => {
    const user = userEvent.setup()
    getPets.mockResolvedValue([
      { id: 3, name: 'Nube', species: 'Gato', age: null },
      {
        id: 4,
        name: 'Pipo',
        species: 'Perro',
        age: '',
        photos: [],
        compatibilityChildren: null,
        compatibilityOtherPets: 'false',
        shelter: { name: '' },
      },
    ])
    renderPage()

    const rows = within(await screen.findByRole('list', { name: 'Mascotas disponibles' })).getAllByRole(
      'listitem',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Nube')
    expect(rows[0]).not.toHaveTextContent('años')
    expect(rows[0]).not.toHaveTextContent('Niños:')
    expect(rows[0]).not.toHaveTextContent('Otras mascotas:')
    expect(rows[1]).toHaveTextContent('Pipo')
    expect(rows[1]).not.toHaveTextContent('años')

    await user.type(screen.getByLabelText('Edad exacta'), '1')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await user.selectOptions(screen.getByLabelText('Espacio requerido'), 'Apartamento')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    await user.selectOptions(screen.getByLabelText('Compatible con niños'), 'true')
    expect(screen.getByText('No encontramos coincidencias')).toBeInTheDocument()
  })

  it('prevents the filter form from navigating or reloading the page', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Luna' })

    fireEvent.submit(screen.getByRole('form', { name: 'Filtros de mascotas' }))

    expect(getPets).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state and hides the registration action from non-admins', async () => {
    getSession.mockReturnValue({ role: 'VISITOR' })
    getPets.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Aún no hay mascotas registradas')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar mascota' })).not.toBeInTheDocument()
  })

  it('shows API errors and lets the user retry', async () => {
    const user = userEvent.setup()
    getPets.mockRejectedValueOnce(new Error('Servicio no disponible'))
    renderPage()

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument()
    expect(getPets).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['successful', (request) => request.resolve(PETS)],
    ['failed', (request) => request.reject(new Error('late error'))],
  ])('ignores a %s response after leaving the page', async (_outcome, settle) => {
    const request = deferred()
    getPets.mockReturnValue(request.promise)
    const { container, unmount } = renderPage()

    unmount()
    await act(async () => settle(request))

    expect(container).toBeEmptyDOMElement()
  })
})
