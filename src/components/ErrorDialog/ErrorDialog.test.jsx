import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorDialog from './ErrorDialog'

function renderDialog(props = {}) {
  const handlers = { onClose: vi.fn(), onCancel: vi.fn() }
  render(
    <ErrorDialog
      title="Error al registrar"
      message="Ya existe un refugio igual."
      status={412}
      hint="Verifique los datos."
      actionLabel="Modificar datos"
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('ErrorDialog', () => {
  it('is an alert dialog with its title, message, hint and named status', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: 'Error al registrar' })
    expect(dialog).toHaveAccessibleDescription('Ya existe un refugio igual.')
    expect(dialog).toHaveTextContent('Error 412 • Conflicto de registro')
    expect(dialog).toHaveTextContent('Verifique los datos.')
  })

  it('shows only the number for a status without a name', () => {
    renderDialog({ status: 500 })

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Error 500')
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('•')
  })

  it('does not show a status when there is none (connection errors)', () => {
    renderDialog({ status: 0 })

    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('Error 0')
  })

  it('puts the focus on the main action and closes with it', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()
    const action = screen.getByRole('button', { name: 'Modificar datos' })

    expect(action).toHaveFocus()
    await user.click(action)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('offers to leave the form only when it is told how', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Cancelar / Volver' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('has no cancel button without onCancel and no hint without hint', () => {
    renderDialog({ onCancel: undefined, hint: undefined })

    expect(screen.queryByRole('button', { name: 'Cancelar / Volver' })).not.toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('Verifique')
  })
})