import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { getSession } from '../../config/session'

vi.mock('../../config/session', () => ({
  ROLES: {
    ADMIN: 'ADMIN',
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    VETERINARIAN: 'VETERINARIAN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
  getSession: vi.fn(),
}))

function renderNavbar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    getSession.mockReturnValue({ role: 'ADOPTER', name: 'Ana Gómez' })
  })

  it('keeps the main destinations visible and marks the current section', () => {
    renderNavbar('/shelters')

    expect(screen.getByRole('link', { name: 'Huellitas Seguras' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Mascotas' })).toHaveAttribute('href', '/pets')
    expect(screen.getByRole('link', { name: 'Refugios' })).toHaveAttribute('aria-current', 'page')
  })

  it('groups secondary sections in an accessible menu and closes it after navigation', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const more = screen.getByRole('button', { name: 'Más secciones' })
    await user.click(more)
    expect(screen.getByRole('link', { name: 'Veterinarios' })).toHaveAttribute(
      'href',
      '/veterinarians',
    )
    expect(screen.getByRole('link', { name: 'Eventos médicos' })).toHaveAttribute(
      'href',
      '/medical-events',
    )
    expect(screen.queryByRole('link', { name: 'Mis seguimientos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Adoptantes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Notificaciones' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Veterinarios' }))

    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Veterinarios' })).not.toBeInTheDocument()
  })

  it('closes the secondary menu with Escape and returns focus to its trigger', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const more = screen.getByRole('button', { name: 'Más secciones' })
    await user.click(more)
    screen.getByRole('link', { name: 'Veterinarios' }).focus()
    await user.keyboard('{Escape}')

    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(more).toHaveFocus()
  })

  it('opens the compact navigation and closes it after choosing a destination', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const toggle = screen.getByRole('button', { name: 'Abrir menú' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('link', { name: 'Refugios' }))
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('shows admin registration actions as one grouped menu', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'ADMIN', name: 'AdminUser' })
    renderNavbar()

    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )
    expect(screen.getByRole('link', { name: 'Registrar refugio' })).toHaveAttribute(
      'href',
      '/shelters/new',
    )
    expect(screen.getByRole('link', { name: 'Registrar veterinario' })).toHaveAttribute(
      'href',
      '/veterinarians/new',
    )
  })

  it('shows shelter operations to shelter administrators without global registration actions', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', name: 'AdminUser' })
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByRole('link', { name: 'Inventario de mascotas' })).toHaveAttribute(
      'href',
      '/pets/inventory',
    )
    expect(screen.getByRole('link', { name: 'Registrar evento médico' })).toHaveAttribute(
      'href',
      '/medical-events/new',
    )
    expect(screen.queryByRole('link', { name: 'Registrar refugio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar mascota' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar veterinario' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Más secciones' }))
    expect(screen.queryByRole('link', { name: 'Adoptantes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mis seguimientos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Notificaciones' })).not.toBeInTheDocument()
  })

  it('shows only admin-relevant pages to a global administrator', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'ADMIN', name: 'Root' })
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'Más secciones' }))

    expect(screen.getByRole('link', { name: 'Adoptantes' })).toHaveAttribute('href', '/adopters')
    expect(screen.queryByRole('link', { name: 'Mis seguimientos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Notificaciones' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar adoptante' })).not.toBeInTheDocument()
  })

  it('shows veterinarian follow-ups and medical-event registration only to veterinarians', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'VETERINARIAN', name: 'Dra. Ana' })
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'Más secciones' }))
    expect(screen.getByRole('link', { name: 'Mis seguimientos' })).toHaveAttribute(
      'href',
      '/followUps',
    )
    expect(screen.queryByRole('link', { name: 'Adoptantes' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(screen.getByRole('link', { name: 'Registrar evento médico' })).toHaveAttribute(
      'href',
      '/medical-events/new',
    )
  })

  it('shows adopter registration but not adopter administration to visitors', async () => {
    const user = userEvent.setup()
    getSession.mockReturnValue({ role: 'VISITOR', name: '' })
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'Más secciones' }))

    expect(screen.getByRole('link', { name: 'Registrar adoptante' })).toHaveAttribute(
      'href',
      '/adopters/new',
    )
    expect(screen.queryByRole('link', { name: 'Adoptantes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
  })

  it('does not show the admin menu to other roles', () => {
    renderNavbar()

    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
  })

  it('shows the current user name and role in the profile link', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', name: 'AdminUser' })

    renderNavbar()

    const profile = screen.getByRole('link', { name: 'Perfil de AdminUser' })
    expect(profile).toHaveAttribute('href', '/profile')
    expect(profile).toHaveTextContent('AdminUser')
    expect(profile).toHaveTextContent('Administrador de refugio')
  })

  it('shows a generic user when the session has no name or a known role', () => {
    getSession.mockReturnValue({ role: 'UNKNOWN' })

    renderNavbar()

    const profile = screen.getByRole('link', { name: 'Perfil de Usuario' })
    expect(profile).toHaveTextContent('Usuario')
    expect(profile).toHaveTextContent('Visitante')
  })

  it('shows initials for the profile avatar', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', name: 'AdminUser' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Perfil de AdminUser' })).toHaveTextContent('AU')
  })
})
