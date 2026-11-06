import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { getSession } from '../../config/session'

vi.mock('../../config/session', () => ({
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN', ADOPTER: 'ADOPTER' },
  getSession: vi.fn(),
}))

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/veterinarians']}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    getSession.mockReturnValue({ role: 'ADOPTER' })
  })

  it('links to the veterinarians section', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Veterinarios' })).toHaveAttribute(
      'href',
      '/veterinarians',
    )
    expect(screen.getByRole('link', { name: 'Huellitas Seguras' })).toBeInTheDocument()
  })

  it('shows the option to register a pet to the shelter administrator', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )
  })

  it('shows the option to register a shelter to the shelter administrator', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrar refugio' })).toHaveAttribute(
      'href',
      '/shelters/new',
    )
  })

  it('hides the option to register a shelter from other roles', () => {
    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Registrar refugio' })).not.toBeInTheDocument()
  })

  it('hides the option to register a pet from other roles', () => {
    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Registrar mascota' })).not.toBeInTheDocument()
  })

  it('links to the list of shelters for any role', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Refugios' })).toHaveAttribute('href', '/shelters')
  })

  it('shows the name and role of the current user', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', name: 'AdminUser' })

    renderNavbar()

    const user = screen.getByRole('group', { name: 'Usuario actual' })
    expect(user).toHaveTextContent('AdminUser')
    expect(user).toHaveTextContent('Administrador de refugio')
  })

  it('shows a generic user when the session has no name or a known role', () => {
    getSession.mockReturnValue({ role: 'UNKNOWN' })

    renderNavbar()

    const user = screen.getByRole('group', { name: 'Usuario actual' })
    expect(user).toHaveTextContent('Usuario')
    expect(user).toHaveTextContent('Visitante')
  })

  it('shows the initials of the user in the avatar', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN', name: 'AdminUser' })
    const { unmount } = renderNavbar()
    expect(screen.getByRole('group', { name: 'Usuario actual' })).toHaveTextContent('AU')
    unmount()

    getSession.mockReturnValue({ role: 'ADOPTER', name: 'luna' })
    renderNavbar()
    expect(screen.getByRole('group', { name: 'Usuario actual' })).toHaveTextContent('LU')
  })
})