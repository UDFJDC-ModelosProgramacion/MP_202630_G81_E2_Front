import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthContext from '../../auth/authContext.js'
import LoginPage from './LoginPage.jsx'

function renderPage(signIn, initialEntries = ['/login']) {
  return render(
    <AuthContext.Provider value={{ signIn }}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pets/inventory" element={<h1>Inventario solicitado</h1>} />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('authenticates and returns to the originally requested page', async () => {
    const user = userEvent.setup()
    const signIn = vi.fn().mockResolvedValue({})
    renderPage(signIn, [
      { pathname: '/login', state: { from: { pathname: '/pets/inventory' } } },
    ])

    await user.type(screen.getByLabelText(/^Correo electrónico/), 'luna@example.com')
    await user.type(screen.getByLabelText(/^Contraseña/), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Inventario solicitado' })).toBeInTheDocument()
    expect(signIn).toHaveBeenCalledWith({ email: 'luna@example.com', password: 'secret123' })
  })

  it('shows login failures and keeps the entered credentials available to retry', async () => {
    const user = userEvent.setup()
    const signIn = vi.fn().mockRejectedValue({
      message: 'Credenciales no válidas',
      status: 401,
    })
    renderPage(signIn)

    await user.type(screen.getByLabelText(/^Correo electrónico/), 'luna@example.com')
    await user.type(screen.getByLabelText(/^Contraseña/), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'No se pudo iniciar sesión' })
    expect(dialog).toHaveTextContent('Credenciales no válidas')
    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveValue('luna@example.com')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('wrongpass')

    await user.click(within(dialog).getByRole('button', { name: 'Intentar de nuevo' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('disables the form while sign in is pending and uses the home fallback after success', async () => {
    const user = userEvent.setup()
    let finishSignIn
    const signIn = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finishSignIn = resolve
      }),
    )
    renderPage(signIn)

    await user.type(screen.getByLabelText(/^Correo electrónico/), 'luna@example.com')
    await user.type(screen.getByLabelText(/^Contraseña/), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    const submit = screen.getByRole('button', { name: 'Ingresando...' })
    expect(submit).toBeDisabled()
    finishSignIn({})

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('marks both credentials as required', () => {
    renderPage(vi.fn())

    expect(screen.getByLabelText(/^Correo electrónico/)).toBeRequired()
    expect(screen.getByLabelText(/^Contraseña/)).toBeRequired()
  })
})
