import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { getSession, ROLES } from '../../config/session'

vi.mock('../../config/session', () => ({
  getSession: vi.fn(),
  ROLES: { SHELTER_ADMIN: 'SHELTER_ADMIN' },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReturnValue({ role: ROLES.SHELTER_ADMIN })
  })

  it('welcomes visitors and gives clear paths to pets and shelters', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /Un hogar cambia una vida/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conocer mascotas' })).toHaveAttribute('href', '/pets')
    expect(screen.getByRole('link', { name: 'Explorar refugios' })).toHaveAttribute('href', '/shelters')
  })

  it('shows useful links for the main areas of the platform', () => {
    renderPage()

    const explore = screen.getByRole('region', { name: 'Da el siguiente paso a tu manera' })
    expect(within(explore).getByRole('link', { name: /Explorar mascotas/ })).toHaveAttribute(
      'href',
      '/pets',
    )
    expect(within(explore).getByRole('link', { name: /Ver refugios/ })).toHaveAttribute('href', '/shelters')
    expect(within(explore).getByRole('link', { name: /Conocer veterinarios/ })).toHaveAttribute(
      'href',
      '/veterinarians',
    )
    expect(within(explore).getByRole('link', { name: /Ver eventos médicos/ })).toHaveAttribute(
      'href',
      '/medical-events',
    )
  })

  it('offers shelter and pet registration to shelter administrators only', () => {
    const { rerender } = renderPage()

    expect(screen.getByRole('heading', { name: '¿Administras un refugio?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar refugio' })).toHaveAttribute(
      'href',
      '/shelters/new',
    )
    expect(screen.getByRole('link', { name: 'Registrar mascota' })).toHaveAttribute(
      'href',
      '/pets/new',
    )

    getSession.mockReturnValue({ role: 'ADOPTER' })
    rerender(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('heading', { name: '¿Administras un refugio?' })).not.toBeInTheDocument()
  })
})
