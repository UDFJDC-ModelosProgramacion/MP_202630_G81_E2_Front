import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalDialog, { DialogActions, DialogButton, DialogPill, DialogTitle } from './ModalDialog'

function renderDialog(tone = 'error') {
  const onClose = vi.fn()
  render(
    <ModalDialog tone={tone} role="dialog" labelledBy="title" onClose={onClose}>
      <DialogPill>Etiqueta</DialogPill>
      <DialogTitle id="title">Título</DialogTitle>
      <p>Contenido</p>
      <DialogActions>
        <DialogButton autoFocus>Aceptar</DialogButton>
        <DialogButton variant="secondary">Volver</DialogButton>
      </DialogActions>
    </ModalDialog>,
  )
  return onClose
}

describe('ModalDialog', () => {
  it('is a modal dialog named after its title, with its content and actions', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog', { name: 'Título' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('Etiqueta')
    expect(dialog).toHaveTextContent('Contenido')
    expect(screen.getByRole('button', { name: 'Aceptar' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it.each([
    ['error', '!'],
    ['success', '✓'],
  ])('shows the %s badge', (tone, symbol) => {
    renderDialog(tone)

    expect(screen.getByRole('dialog')).toHaveTextContent(symbol)
  })

  it('keeps the click-outside button out of the tab order, so Tab stays on the actions', async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('tabindex', '-1')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus()
  })

  it('closes with Escape and with a click outside, but not with a click inside', async () => {
    const user = userEvent.setup()
    const onClose = renderDialog()

    await user.click(screen.getByText('Contenido'))
    expect(onClose).not.toHaveBeenCalled()

    await user.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})