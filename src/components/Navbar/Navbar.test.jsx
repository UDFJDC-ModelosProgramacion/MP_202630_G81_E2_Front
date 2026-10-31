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

  it('shows the option to register a pet to the shelter administrator', () => {
    getSession.mockReturnValue({ role: 'SHELTER_ADMIN' })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )
  })

  it('hides the option to register a pet from other roles', () => {
    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Registrar mascota' })).not.toBeInTheDocument()
  })
})