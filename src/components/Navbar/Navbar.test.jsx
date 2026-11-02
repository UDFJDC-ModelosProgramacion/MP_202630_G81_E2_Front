import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { getSession, ROLES } from '../../config/session'

vi.mock('../../config/session', () => ({
  ROLES: {
    SHELTER_ADMIN: 'SHELTER_ADMIN',
    ADOPTER: 'ADOPTER',
    VISITOR: 'VISITOR',
  },
  getSession: vi.fn(),
}))

function renderNavbar(path = '/veterinarians') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    getSession.mockReturnValue({ role: ROLES.SHELTER_ADMIN })
  })

  it('links to the veterinarians section', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Veterinarios' })).toHaveAttribute(
      'href',
      '/veterinarians',
    )
    expect(screen.getByRole('link', { name: 'Pet Adoption Platform' })).toBeInTheDocument()
  })

  it('shows the register option only to visitors', () => {
    getSession.mockReturnValue({ role: ROLES.VISITOR })

    renderNavbar()

    expect(screen.getByRole('link', { name: 'Registrarme' })).toHaveAttribute(
      'href',
      '/adopters/new',
    )
  })

  it('hides the register option for roles that already have a profile', () => {
    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Registrarme' })).not.toBeInTheDocument()
  })
})
