export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function getApiKey() {
  const key = process.env.TMDB_API_KEY
  if (!key) {
    throw new Error('Missing TMDB_API_KEY environment variable')
  }
  return key
}

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function searchForTmdbId(query) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${getApiKey()}&query=${encodeURIComponent(query)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`TMDB search failed (${res.status}) for "${query}"`)
  }

  const data = await res.json()
  const [firstResult] = data.results ?? []

  if (!firstResult) {
    throw new Error(`No TMDB results found for "${query}"`)
  }

  return firstResult.id
}

export async function fetchMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${getApiKey()}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`TMDB movie details request failed (${res.status}) for id ${tmdbId}`)
  }

  return res.json()
}

export function buildFilmRecord(tmdbId, details) {
  return {
    slug: slugify(details.title),
    title: details.title,
    description: details.overview || null,
    genre: details.genres?.[0]?.name ?? null,
    year: details.release_date ? parseInt(details.release_date.slice(0, 4), 10) : null,
    poster_url: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
    tmdb_id: tmdbId,
  }
}
