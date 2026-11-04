import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuccessDialog from './SuccessDialog'

function renderDialog(props = {}) {
  const handlers = { onAction: vi.fn(), onClose: vi.fn() }
  render(
    <SuccessDialog
      title="¡Refugio registrado con éxito!"
      message='El refugio "Patitas Felices" ha sido creado.'
      details={[
        { label: 'NIT', value: '900.069.803-1' },
        { label: 'Ciudad', value: 'Bogotá' },
      ]}
      actionLabel="Ir al detalle"
      closeLabel="Registrar otro"
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('SuccessDialog', () => {
  it('confirms the creation with its title, message and HTTP 201 label', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog', { name: '¡Refugio registrado con éxito!' })
    expect(dialog).toHaveAccessibleDescription('El refugio "Patitas Felices" ha sido creado.')
    expect(dialog).toHaveTextContent('Código HTTP 201 • Creado con éxito')
  })

  it('can describe an update with its own HTTP label', () => {
    renderDialog({
      title: '¡Evento médico actualizado con éxito!',
      statusLabel: 'Código HTTP 200 • Actualizado con éxito',
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('Código HTTP 200 • Actualizado con éxito')
    expect(screen.queryByText('Código HTTP 201 • Creado con éxito')).not.toBeInTheDocument()
  })

  it('summarizes what was created', () => {
    renderDialog()

    const nit = screen.getByText('NIT').parentElement
    expect(within(nit).getByText('900.069.803-1')).toBeInTheDocument()
    expect(within(screen.getByText('Ciudad').parentElement).getByText('Bogotá')).toBeInTheDocument()
  })

  it('has no summary and no warning when there is nothing to show', () => {
    renderDialog({ details: undefined })

    expect(screen.queryByText('NIT')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a warning that did not undo the creation', () => {
    renderDialog({ warning: 'La foto no se pudo guardar.' })

    expect(screen.getByRole('status')).toHaveTextContent('La foto no se pudo guardar.')
  })

  it('focuses the main action, which goes on to the detail', async () => {
    const user = userEvent.setup()
    const { onAction, onClose } = renderDialog()
    const action = screen.getByRole('button', { name: 'Ir al detalle' })

    expect(action).toHaveFocus()
    await user.click(action)

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('lets the user register another one with the secondary action or Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Registrar otro' }))
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})