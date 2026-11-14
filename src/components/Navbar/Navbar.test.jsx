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
    expect(screen.getByRole('link', { name: 'Pet Adoption Platform' })).toBeInTheDocument()
  })

  it('links the adopter to the list of the trial cohabitation requests', () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute(
      'href',
      '/trial-cohabitation-requests',
    )
  })

  it('links the shelter administrator to the requests received by the shelter', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Solicitudes de convivencia' })).toHaveAttribute(
      'href',
      '/trial-cohabitation-requests/received',
    )
  })

  it('links the shelter administrator to the adoption registration', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrar adopción' })).toHaveAttribute(
      'href',
      '/adoptions/new',
    )
  })

  it('links the adopter to the list of their adoptions', () => {
    getSession.mockReturnValue({ role: 'ADOPTER' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Mis adopciones' })).toHaveAttribute(
      'href',
      '/adoptions/mine',
    )
  })

  it('links the shelter administrator to the adoptions of the shelter', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Adopciones del refugio' })).toHaveAttribute(
      'href',
      '/adoptions/shelter',
    )
  })

  it('does not show the adopter link to the shelter administrator', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Mis solicitudes' })).not.toBeInTheDocument()
  })

  it('links to the medical events list for every role', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Eventos médicos' })).toHaveAttribute(
      'href',
      '/medical-events',
    )
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

  it('shows the option to register a medical event to the shelter administrator', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrar evento médico' })).toHaveAttribute(
      'href',
      '/medical-events/new',
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
})