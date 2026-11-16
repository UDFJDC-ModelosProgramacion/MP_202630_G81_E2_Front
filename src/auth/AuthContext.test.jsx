import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthContext.jsx'
import useAuth from './useAuth.js'
import { setSession } from '../config/session'
import { getCurrentUser, login, logout } from '../services/authService'

vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

function AuthState() {
  const { session, status, signIn, signOut } = useAuth()
  return (
    <div>
      <p>{status}</p>
      <p>{session.email || 'signed out'}</p>
      <button onClick={() => signIn({ email: 'new@example.com', password: 'secret' })}>
        Sign in
      </button>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setSession(null)
    getCurrentUser.mockResolvedValue({ id: 1, email: 'current@example.com', role: 'ADOPTER' })
    login.mockResolvedValue({ id: 2, email: 'new@example.com', role: 'ADOPTER' })
    logout.mockResolvedValue(null)
  })

  it('restores, signs in, and clears the server-authenticated session', async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    expect(await screen.findByText('current@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('new@example.com')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret' })

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument())
    expect(logout).toHaveBeenCalledOnce()
  })
})
