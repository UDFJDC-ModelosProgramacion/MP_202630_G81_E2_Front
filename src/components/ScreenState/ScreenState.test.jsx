import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScreenState from './ScreenState'

describe('ScreenState', () => {
  it('shows the default loading text as a status', () => {
    render(<ScreenState state="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
  })

  it('shows errors as an alert', () => {
    render(<ScreenState state="error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error. Inténtelo de nuevo.')
  })

  it('shows the default empty text', () => {
    render(<ScreenState state="empty" />)
    expect(screen.getByRole('status')).toHaveTextContent('No hay resultados.')
  })

  it('prefers a custom message', () => {
    render(<ScreenState state="error" message="Veterinarian not found" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Veterinarian not found')
  })

  it('offers an accessible retry action when supplied', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ScreenState state="error" message="No se pudo cargar" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})