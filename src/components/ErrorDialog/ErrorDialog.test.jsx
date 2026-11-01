import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorDialog from './ErrorDialog'

function renderDialog(props = {}) {
  const onClose = vi.fn()
  render(
    <ErrorDialog
      title="Error al registrar"
      message="Ya existe un refugio igual."
      status={412}
      actionLabel="Modificar datos"
      onClose={onClose}
      {...props}
    />,
  )
  return onClose
}

describe('ErrorDialog', () => {
  it('is an alert dialog with its title, message and status', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: 'Error al registrar' })
    expect(dialog).toHaveAccessibleDescription('Ya existe un refugio igual.')
    expect(dialog).toHaveTextContent('Error 412')
  })

  it('does not show a status when there is none (connection errors)', () => {
    renderDialog({ status: 0 })

    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('Error 0')
  })

  it('puts the focus on the action and closes with it', async () => {
    const user = userEvent.setup()
    const onClose = renderDialog()
    const action = screen.getByRole('button', { name: 'Modificar datos' })

    expect(action).toHaveFocus()
    await user.click(action)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes with Escape and with a click outside, but not with a click inside', async () => {
    const user = userEvent.setup()
    const onClose = renderDialog()

    await user.click(screen.getByText('Ya existe un refugio igual.'))
    expect(onClose).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('alertdialog').parentElement)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})