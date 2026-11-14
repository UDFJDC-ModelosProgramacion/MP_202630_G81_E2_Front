import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FollowUpCard from './FollowUpCard'

const baseFollowUp = {
  id: 5,
  date: '2030-01-15T00:00:00.000+00:00',
  observation: 'Buena adaptación',
  veterinarian: { id: 1, firstName: 'Laura', lastName: 'Gómez' },
  adoption: { id: 1 },
}

const renderCard = (followUp, props = {}) =>
  render(
    <MemoryRouter>
      <ul>
        <FollowUpCard followUp={followUp} {...props} />
      </ul>
    </MemoryRouter>,
  )

describe('FollowUpCard', () => {
  it('shows the day, status, observation and veterinarian', () => {
    renderCard(baseFollowUp)

    expect(screen.getByText('Seguimiento del 15 ene 2030')).toBeInTheDocument()
    expect(screen.getByText('Próximo')).toBeInTheDocument()
    expect(screen.getByText('Buena adaptación')).toBeInTheDocument()
    expect(screen.getByText('Veterinario: Laura Gómez')).toBeInTheDocument()
  })

  it('marks a past day as vencido', () => {
    renderCard({ ...baseFollowUp, date: '2020-01-01T00:00:00.000+00:00' })

    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(screen.queryByText('Próximo')).toBeNull()
  })

  it('shows a fallback when there is no veterinarian', () => {
    renderCard({ ...baseFollowUp, veterinarian: null })

    expect(screen.getByText('Veterinario: —')).toBeInTheDocument()
  })

  it('links to the adoption list only when asked', () => {
    renderCard(baseFollowUp, { showAdoption: true })

    const link = screen.getByRole('link', { name: '#1' })
    expect(link).toHaveAttribute('href', '/adoptions/1/followUps')
  })
})
