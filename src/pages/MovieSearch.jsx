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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Kaiju Vault — Movie Search</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a kaiju movie..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((movie) => (
          <div key={movie.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
            {movie.poster_path && (
              <img src={`${TMDB_IMAGE_BASE}${movie.poster_path}`} alt={movie.title} width={100} />
            )}
            <div>
              <h3>{movie.title}</h3>
              <p>{movie.overview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieSearch
