import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth.jsx'
import { API_BASE_URL } from '../lib/apiBase.js'

async function parseErrorMessage(res, fallback) {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export function useWatchlist() {
  const { token } = useAuth()
  const [watchlist, setWatchlist] = useState([])
  const [allFilms, setAllFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  )

  const refresh = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const [watchlistRes, filmsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/watchlist`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/films`),
      ])

      if (!watchlistRes.ok) {
        throw new Error(await parseErrorMessage(watchlistRes, 'Failed to load watchlist.'))
      }
      if (!filmsRes.ok) {
        throw new Error(await parseErrorMessage(filmsRes, 'Failed to load films.'))
      }

      const watchlistData = await watchlistRes.json()
      const filmsData = await filmsRes.json()

      setWatchlist(watchlistData.watchlist)
      setAllFilms(filmsData.films)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, authHeaders])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addToWatchlist = useCallback(async (filmId) => {
    const res = await fetch(`${API_BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ filmId }),
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to add film.'))
    }

    await refresh()
  }, [authHeaders, refresh])

  const removeFromWatchlist = useCallback(async (filmId) => {
    const res = await fetch(`${API_BASE_URL}/watchlist/${filmId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to remove film.'))
    }

    await refresh()
  }, [authHeaders, refresh])

  return { watchlist, allFilms, loading, error, addToWatchlist, removeFromWatchlist, refresh }
}
