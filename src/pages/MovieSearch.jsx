import { useState } from 'react'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200'

function MovieSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`TMDB request failed: ${res.status}`)
      }

      const data = await res.json()
      setResults(data.results ?? [])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Movie Search</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a kaiju movie..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      <div className="film-grid">
        {results.map((movie) => (
          <div key={movie.id} className="film-card">
            <div className="film-card-poster">
              {movie.poster_path ? (
                <img src={`${TMDB_IMAGE_BASE}${movie.poster_path}`} alt={movie.title} />
              ) : (
                <div className="film-card-poster-placeholder">{movie.title}</div>
              )}
              <div className="film-card-title-overlay">
                <h3>{movie.title}</h3>
              </div>
            </div>
            <div className="film-card-body">
              <p className="film-description">{movie.overview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieSearch
