import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PendingPage from './PendingPage'

describe('PendingPage', () => {
  it('names the section, says it is not available and offers a way out', () => {
    render(
      <MemoryRouter>
        <PendingPage title="Perfil de mascota" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Perfil de mascota' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('todavía no está disponible')
    expect(screen.getByRole('link', { name: 'Ir a la lista de refugios' })).toHaveAttribute(
      'href',
      '/shelters',
    )
  })
})