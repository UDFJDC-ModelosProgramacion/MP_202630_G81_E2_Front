import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScreenState from './ScreenState'

describe('ScreenState', () => {
  it('shows the default loading text as a status', () => {
    render(<ScreenState state="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
  })

  it('shows errors as an alert', () => {
    render(<ScreenState state="error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error. Inténtalo de nuevo.')
  })

  it('shows the default empty text', () => {
    render(<ScreenState state="empty" />)
    expect(screen.getByRole('status')).toHaveTextContent('No hay resultados.')
  })

  it('prefers a custom message', () => {
    render(<ScreenState state="error" message="Veterinarian not found" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Veterinarian not found')
  })
})
