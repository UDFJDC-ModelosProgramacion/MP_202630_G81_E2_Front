import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from './ConfirmDialog'

function renderDialog(props = {}) {
  const handlers = { onConfirm: vi.fn(), onCancel: vi.fn() }
  render(
    <ConfirmDialog
      title="¿Eliminar este evento médico?"
      message="El evento se borrará de la historia médica. Esta acción no se puede deshacer."
      confirmLabel="Eliminar evento"
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('ConfirmDialog', () => {
  it('asks for confirmation with its title and message', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar este evento médico?' })
    expect(dialog).toHaveAccessibleDescription(
      'El evento se borrará de la historia médica. Esta acción no se puede deshacer.',
    )
  })

  it('focuses the cancel action so that an accidental Enter does not delete', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('calls onConfirm or onCancel from its buttons', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Eliminar evento' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('treats Escape as a cancellation', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderDialog()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cannot be dismissed while the action is pending', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog({ pending: true, pendingLabel: 'Eliminando...' })

    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

    await user.keyboard('{Escape}')

    expect(onCancel).not.toHaveBeenCalled()
  })
})
