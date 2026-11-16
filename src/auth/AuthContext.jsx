import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROLES, getSession, setSession } from '../config/session'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../services/authService'
import AuthContext from './authContext.js'

export function AuthProvider({ children }) {
  const [session, setCurrentSession] = useState(getSession)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((user) => {
        if (active) setCurrentSession(setSession(user))
      })
      .catch((requestError) => {
        if (!active) return
        setCurrentSession(setSession(null))
        if (requestError.status !== 401) setError(requestError.message)
      })
      .finally(() => {
        if (active) setStatus('ready')
      })

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (credentials) => {
    const user = await loginRequest(credentials)
    const nextSession = setSession(user)
    setCurrentSession(nextSession)
    setError(null)
    setStatus('ready')
    return nextSession
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } catch (requestError) {
      if (requestError.status !== 401) throw requestError
    }
    setCurrentSession(setSession(null))
  }, [])

  const value = useMemo(
    () => ({
      session,
      status,
      error,
      isAuthenticated: session.userId != null,
      signIn,
      signOut,
      roles: ROLES,
    }),
    [session, status, error, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

