
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorDialog from './ErrorDialog'

function renderDialog(props = {}) {
  const onClose = vi.fn()

  const result = render(
    <ErrorDialog
      title="Error al registrar"
      message="Ya existe un refugio igual."
      status={412}
      actionLabel="Modificar datos"
      onClose={onClose}
      {...props}
    />,
  )

  return { onClose, ...result }
}

describe('ErrorDialog', () => {
  it('renders an alert dialog with title, message and status', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', {
      name: 'Error al registrar',
    })

    expect(dialog).toHaveAccessibleDescription(
      'Ya existe un refugio igual.',
    )
    expect(dialog).toHaveTextContent('Error 412')
    expect(
      screen.getByRole('button', { name: 'Modificar datos' }),
    ).toBeInTheDocument()
  })

  it('does not render a status when status is zero', () => {
    renderDialog({ status: 0 })

    expect(screen.getByRole('alertdialog')).not.toHaveTextContent(
      'Error 0',
    )
    expect(screen.queryByText('Error 412')).not.toBeInTheDocument()
  })

  it('focuses the action button when mounted', () => {
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Modificar datos' }),
    ).toHaveFocus()
  })

  it('closes when the action button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.click(
      screen.getByRole('button', { name: 'Modificar datos' }),
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when another key is pressed', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.keyboard('a')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes when the backdrop button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.click(
      screen.getByRole('button', { name: 'Cerrar diálogo' }),
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when the dialog content is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.click(
      screen.getByText('Ya existe un refugio igual.'),
    )

    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes the Escape listener when unmounted', () => {
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderDialog()

    unmount()

    expect(removeListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    )

    removeListener.mockRestore()
  })

  it('registers the Escape listener when mounted', () => {
    const addListener = vi.spyOn(document, 'addEventListener')
    const { unmount } = renderDialog()

    expect(addListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    )

    unmount()
    addListener.mockRestore()
  })
})