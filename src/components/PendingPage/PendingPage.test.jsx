import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PendingPage from './PendingPage'

describe('PendingPage', () => {
  it('explains that the section is pending and offers useful destinations', () => {
    render(
      <MemoryRouter>
        <PendingPage title="Notificaciones" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Notificaciones' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Esta función aún no está disponible')
    expect(screen.getByRole('link', { name: 'Explorar mascotas' })).toHaveAttribute('href', '/pets')
    expect(screen.getByRole('link', { name: 'Explorar refugios' })).toHaveAttribute(
      'href',
      '/shelters',
    )
  })
})