import { useState } from 'react'
import { useWatchlist } from '../hooks/useWatchlist.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { API_BASE_URL } from '../lib/apiBase.js'
import FilmCard from '../components/FilmCard.jsx'

function Watchlist() {
  const { watchlist, allFilms, loading, error, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const { token } = useAuth()
  const [actionError, setActionError] = useState(null)
  const [recommendationResult, setRecommendationResult] = useState(null)
  const [recommendationError, setRecommendationError] = useState(null)
  const [recommendationLoading, setRecommendationLoading] = useState(false)

  async function handleGetRecommendation() {
    setRecommendationLoading(true)
    setRecommendationError(null)
    setRecommendationResult(null)

    try {
      const res = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get a recommendation.')
      }

      setRecommendationResult(data)
    } catch (err) {
      setRecommendationError(err.message)
    } finally {
      setRecommendationLoading(false)
    }
  }

  const watchlistFilmIds = new Set(watchlist.map((film) => film.id))

  async function handleAdd(filmId) {
    setActionError(null)
    try {
      await addToWatchlist(filmId)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleRemove(filmId) {
    setActionError(null)
    try {
      await removeFromWatchlist(filmId)
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (loading) {
    return <p className="page-status">Loading your watchlist...</p>
  }

  return (
    <div className="watchlist-page">
      <h1>Your Watchlist</h1>

      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {watchlist.length === 0 ? (
        <p>No films saved yet — add one from the list below.</p>
      ) : (
        <div className="film-grid">
          {watchlist.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              action={
                <button type="button" className="btn-danger" onClick={() => handleRemove(film.id)}>
                  Remove
                </button>
              }
            />
          ))}
        </div>
      )}

      <div className="recommendation-section">
        <button type="button" onClick={handleGetRecommendation} disabled={recommendationLoading}>
          {recommendationLoading ? 'Thinking...' : 'Get a Recommendation'}
        </button>

        {recommendationError && <p className="error">{recommendationError}</p>}

        {recommendationResult && (
          <div className="recommendation-card">
            {recommendationResult.message ? (
              <p>{recommendationResult.message}</p>
            ) : (
              <>
                <p>{recommendationResult.recommendation}</p>
                {recommendationResult.film && (
                  <div className="recommendation-film">
                    <FilmCard
                      film={recommendationResult.film}
                      action={
                        <button
                          type="button"
                          disabled={watchlistFilmIds.has(recommendationResult.film.id)}
                          onClick={() => handleAdd(recommendationResult.film.id)}
                        >
                          {watchlistFilmIds.has(recommendationResult.film.id)
                            ? 'In Watchlist'
                            : 'Add to Watchlist'}
                        </button>
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="action-divider" />

      <h2>Add a Film</h2>

      {allFilms.length === 0 ? (
        <p>No films in the catalog yet.</p>
      ) : (
        <div className="film-grid">
          {allFilms.map((film) => {
            const alreadySaved = watchlistFilmIds.has(film.id)
            return (
              <FilmCard
                key={film.id}
                film={film}
                action={
                  <button
                    type="button"
                    disabled={alreadySaved}
                    onClick={() => handleAdd(film.id)}
                  >
                    {alreadySaved ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Watchlist
