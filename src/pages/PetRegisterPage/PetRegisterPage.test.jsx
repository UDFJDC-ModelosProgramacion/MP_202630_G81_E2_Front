import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import PetRegisterPage from './PetRegisterPage'
import { getSession } from '../../config/session'
import { addPetPhoto, createPet } from '../../services/petService'
import { todayISO } from '../../utils/dates'

vi.mock('../../services/petService', () => ({ createPet: vi.fn(), addPetPhoto: vi.fn() }))
vi.mock('../../config/session', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

function PetProfileStub() {
  const { state } = useLocation()
  return <p>Perfil de la mascota. {state?.notice}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/new']}>
      <Routes>
        <Route path="/pets/new" element={<PetRegisterPage />} />
        <Route path="/pets/:petId" element={<PetProfileStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

const textbox = (name) => screen.getByRole('textbox', { name })
const combobox = (name) => screen.getByRole('combobox', { name })
const arrivalEvent = (number = 1) =>
  within(screen.getByRole('group', { name: `Evento de llegada ${number}` }))

async function fillRequiredFields(user, { name = 'Luna' } = {}) {
  await user.type(textbox('Nombre'), name)
  await user.selectOptions(combobox('Especie'), 'Perro')
  await user.type(textbox('Raza'), 'Criollo')
  await user.type(screen.getByRole('spinbutton', { name: 'Edad' }), '3')
  await user.selectOptions(combobox('Sexo'), 'Hembra')
  await user.selectOptions(combobox('Tamaño'), 'Mediano')
  await user.type(textbox('Estado de salud'), 'Saludable')
  fireEvent.change(screen.getByLabelText(/^Fecha de ingreso/), { target: { value: '2026-10-01' } })
  await user.selectOptions(combobox('Nivel de actividad'), 'Alto')
  await user.selectOptions(combobox('Espacio requerido'), 'Apartamento')
  await user.selectOptions(combobox('Compatible con niños'), 'Sí')
  await user.selectOptions(combobox('Compatible con otras mascotas'), 'No')
}

async function fillArrivalEvent(user, number = 1) {
  const event = arrivalEvent(number)
  fireEvent.change(event.getByLabelText(/^Fecha/), { target: { value: '2026-10-01' } })
  await user.selectOptions(event.getByRole('combobox', { name: 'Tipo' }), 'Rescate')
  await user.type(event.getByRole('textbox', { name: 'Descripción' }), 'Rescatada en la calle')
}

const submit = (user) => user.click(screen.getByRole('button', { name: 'Registrar' }))

describe('PetRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', shelterId: 3 })
  })

  it('shows the form with its mandatory fields marked', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Registre su Mascota' })).toBeInTheDocument()
    expect(textbox('Nombre')).toHaveAttribute('aria-required', 'true')
    expect(combobox('Compatible con niños')).toHaveAttribute('aria-required', 'true')
    expect(textbox('Temperamento')).toHaveAttribute('aria-required', 'false')
    expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
  })

  it('offers fixed lists for the fields the backend compares as text', () => {
    renderPage()

    const species = within(combobox('Especie')).getAllByRole('option')
    expect(species.map((option) => option.textContent)).toContain('Perro')
    expect(within(combobox('Compatible con niños')).getAllByRole('option')).toHaveLength(3)
  })

  it('does not let the admission date go past today', () => {
    renderPage()

    expect(screen.getByLabelText(/^Fecha de ingreso/)).toHaveAttribute('max', todayISO())
  })

  it('explains that only the shelter administrator can register pets', () => {
    getSession.mockReturnValue({ role: 'ADOPTER', shelterId: null })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo el administrador de un refugio puede registrar mascotas.',
    )
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
  })

  it('validates on the client, focuses the first error and does not call the backend', async () => {
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(createPet).not.toHaveBeenCalled()
    expect(textbox('Nombre')).toHaveAccessibleDescription('Este campo es obligatorio.')
    expect(textbox('Nombre')).toHaveFocus()
    expect(arrivalEvent().getByRole('textbox', { name: 'Descripción' })).toHaveAccessibleDescription(
      'Este campo es obligatorio.',
    )
  })

  it('focuses the first invalid field of the arrival event when the pet is complete', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await submit(user)

    expect(createPet).not.toHaveBeenCalled()
    expect(arrivalEvent().getByLabelText(/^Fecha/)).toHaveFocus()
  })

  it('rejects a future admission date', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)
    fireEvent.change(screen.getByLabelText(/^Fecha de ingreso/), { target: { value: '2999-01-01' } })

    await submit(user)

    expect(createPet).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Fecha de ingreso/)).toHaveAccessibleDescription(
      'La fecha de ingreso no puede ser futura.',
    )
  })

  it('clears the error of a field as soon as it is corrected', async () => {
    const user = userEvent.setup()
    renderPage()
    await submit(user)

    await user.type(textbox('Nombre'), 'Luna')

    expect(textbox('Nombre')).not.toHaveAccessibleDescription()
  })

  it('registers the pet in the administrator shelter and opens its profile', async () => {
    const user = userEvent.setup()
    createPet.mockResolvedValue({ id: 12 })
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)

    await submit(user)

    expect(await screen.findByText(/Perfil de la mascota/)).toHaveTextContent(
      'Mascota registrada con éxito.',
    )
    expect(createPet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Luna',
        species: 'Perro',
        age: 3,
        compatibilityChildren: true,
        compatibilityOtherPets: false,
        description: null,
        shelter: { id: 3 },
        medicalEvents: [
          { date: '2026-10-01', type: 'Rescate', description: 'Rescatada en la calle' },
        ],
      }),
    )
  })

  it('sends the optional fields when they are filled', async () => {
    const user = userEvent.setup()
    createPet.mockResolvedValue({ id: 1 })
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)
    await user.type(screen.getAllByRole('textbox', { name: 'Descripción' })[0], 'Juguetona')
    await user.type(textbox('Temperamento'), 'Sociable')
    await user.type(textbox('Necesidades específicas'), 'Ninguna')

    await submit(user)

    await waitFor(() => expect(createPet).toHaveBeenCalled())
    expect(createPet.mock.calls[0][0]).toMatchObject({
      description: 'Juguetona',
      temperament: 'Sociable',
      specificNeeds: 'Ninguna',
    })
  })

  it('shows a loading state and blocks the button while the pet is being created', async () => {
    const user = userEvent.setup()
    createPet.mockReturnValue(new Promise(() => {}))
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)

    await submit(user)

    expect(await screen.findByRole('status')).toHaveTextContent('Registrando mascota...')
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })

  it('lets the user add and remove arrival events, keeping at least one', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('button', { name: /^Quitar evento/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '+ Agregar otro evento' }))
    expect(screen.getByRole('group', { name: 'Evento de llegada 2' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar evento 2' }))

    expect(screen.queryByRole('group', { name: 'Evento de llegada 2' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Evento de llegada 1' })).toBeInTheDocument()
  })

  it('sends every arrival event', async () => {
    const user = userEvent.setup()
    createPet.mockResolvedValue({ id: 5 })
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)
    await user.click(screen.getByRole('button', { name: '+ Agregar otro evento' }))
    await fillArrivalEvent(user, 2)

    await submit(user)

    await waitFor(() => expect(createPet).toHaveBeenCalled())
    expect(createPet.mock.calls[0][0].medicalEvents).toHaveLength(2)
  })

  it('shows the backend message next to its field and keeps what the user typed', async () => {
    const user = userEvent.setup()
    createPet.mockRejectedValue(new Error('Admission date cannot be a future date'))
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)

    await submit(user)

    expect(await screen.findByLabelText(/^Fecha de ingreso/)).toHaveAccessibleDescription(
      'Admission date cannot be a future date',
    )
    expect(textbox('Nombre')).toHaveValue('Luna')
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
  })

  it.each([
    'Pet must be associated with an existing shelter',
    'The shelter with the given id was not found',
    'A pet with the same shelter, name, species and admission date already exists',
  ])('shows "%s" in an alert and keeps the form', async (message) => {
    const user = userEvent.setup()
    createPet.mockRejectedValue(new Error(message))
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(textbox('Nombre')).toHaveValue('Luna')
  })

  it('shows the message of the arrival events in their own section', async () => {
    const user = userEvent.setup()
    const message =
      'A pet must be registered with at least one medical event describing its arrival at the shelter'
    createPet.mockRejectedValue(new Error(message))
    renderPage()
    await fillRequiredFields(user)
    await fillArrivalEvent(user)

    await submit(user)

    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  describe('profile photo', () => {
    const PHOTO_URL = 'https://fotos.example.com/luna.png'
    const photoUrlField = () => screen.getByRole('textbox', { name: 'Enlace de la fotografía' })

    async function registerWithPhoto(user, url = PHOTO_URL) {
      renderPage()
      await fillRequiredFields(user)
      await fillArrivalEvent(user)
      await user.type(photoUrlField(), url)
      await submit(user)
    }

    it('is optional: a pet without photo does not call the photos endpoint', async () => {
      const user = userEvent.setup()
      createPet.mockResolvedValue({ id: 7 })
      renderPage()
      expect(photoUrlField()).toHaveAttribute('aria-required', 'false')
      await fillRequiredFields(user)
      await fillArrivalEvent(user)

      await submit(user)

      await screen.findByText(/Perfil de la mascota/)
      expect(addPetPhoto).not.toHaveBeenCalled()
    })

    it('previews the photo and picks its format from the link', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.type(photoUrlField(), PHOTO_URL)

      expect(screen.getByRole('img', { name: 'Vista previa de la fotografía' })).toHaveAttribute(
        'src',
        PHOTO_URL,
      )
      expect(combobox('Formato')).toHaveValue('PNG')
    })

    it('says so when the preview cannot be loaded', async () => {
      const user = userEvent.setup()
      renderPage()
      await user.type(photoUrlField(), PHOTO_URL)

      fireEvent.error(screen.getByRole('img', { name: 'Vista previa de la fotografía' }))

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('No se pudo cargar la imagen.')).toBeInTheDocument()
    })

    it('saves the photo of the created pet and then opens its profile', async () => {
      const user = userEvent.setup()
      createPet.mockResolvedValue({ id: 12 })
      addPetPhoto.mockResolvedValue({ id: 1 })

      await registerWithPhoto(user)

      expect(await screen.findByText(/Perfil de la mascota/)).toHaveTextContent(
        'Mascota registrada con éxito.',
      )
      expect(addPetPhoto).toHaveBeenCalledWith(12, {
        url: PHOTO_URL,
        type: 'PNG',
        description: 'Foto de perfil',
      })
    }, 10000)

    it('does not create the pet when the link is not valid and focuses it', async () => {
      const user = userEvent.setup()

      await registerWithPhoto(user, 'luna.png')

      expect(createPet).not.toHaveBeenCalled()
      expect(photoUrlField()).toHaveFocus()
      expect(photoUrlField()).toHaveAccessibleDescription(
        'Ingrese un enlace válido que empiece por http:// o https://.',
      )
    })

    it('asks for the format when it cannot be read from the link', async () => {
      const user = userEvent.setup()

      await registerWithPhoto(user, 'https://fotos.example.com/luna')

      expect(createPet).not.toHaveBeenCalled()
      expect(combobox('Formato')).toHaveAccessibleDescription('Seleccione el formato de la imagen.')
    })

    it('keeps the registered pet when only the photo fails and tells the user', async () => {
      const user = userEvent.setup()
      createPet.mockResolvedValue({ id: 12 })
      addPetPhoto.mockRejectedValue(new Error('Photo format is not valid'))

      await registerWithPhoto(user)

      expect(await screen.findByText(/Perfil de la mascota/)).toHaveTextContent(
        'Mascota registrada con éxito, pero la foto no se pudo guardar: Photo format is not valid',
      )
    })
  }, 10000)

  it('lets the user cancel and go back to the pets', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('form', { name: 'Registro de mascota' })).not.toBeInTheDocument()
  })
})
