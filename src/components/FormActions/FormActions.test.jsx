import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormActions from './FormActions'

describe('FormActions', () => {
  it('shows the hint, a submit button and a cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<FormActions submitLabel="Registrar" submitting={false} onCancel={onCancel} />)

    expect(screen.getByText('*Campos obligatorios')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar' })).toHaveAttribute('type', 'submit')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('blocks the submit button while submitting', () => {
    render(<FormActions submitLabel="Registrar" submitting onCancel={() => {}} />)

    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })
})