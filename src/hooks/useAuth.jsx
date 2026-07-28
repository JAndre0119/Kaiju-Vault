import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { API_BASE_URL } from '../lib/apiBase.js'

const TOKEN_STORAGE_KEY = 'kaiju_vault_token'

const AuthContext = createContext(null)

async function parseErrorMessage(res, fallback) {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = useCallback(async (activeToken) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })

    if (!res.ok) {
      throw new Error('Session expired')
    }

    const data = await res.json()
    return data.user
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const user = await fetchCurrentUser(token)
        if (!cancelled) {
          setCurrentUser(user)
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setCurrentUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [token, fetchCurrentUser])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Login failed.'))
    }

    const { token: newToken } = await res.json()
    const user = await fetchCurrentUser(newToken)

    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
    setCurrentUser(user)
  }, [fetchCurrentUser])

  const register = useCallback(async (username, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Registration failed.'))
    }

    await login(email, password)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setCurrentUser(null)
  }, [])

  const value = { currentUser, loading, token, register, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
