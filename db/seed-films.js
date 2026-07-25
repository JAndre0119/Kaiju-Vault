import '../env.js'

import { supabase } from './supabaseClient.js'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const REQUEST_DELAY_MS = 250

if (!TMDB_API_KEY) {
  throw new Error('Missing TMDB_API_KEY environment variable')
}

// Add more titles here — either { query: 'Some Title' } to resolve the id via
// TMDB search, or { tmdbId: 12345 } if you already know the exact TMDB movie id.
const FILMS_TO_SEED = [
  { query: 'Godzilla Minus One' },
  { query: 'Shin Godzilla' },
  { query: 'Godzilla x Kong: The New Empire' },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function searchForTmdbId(query) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
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

async function fetchMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`TMDB movie details request failed (${res.status}) for id ${tmdbId}`)
  }

  return res.json()
}

async function run() {
  const summary = { inserted: 0, skipped: 0, failed: 0 }

  for (const entry of FILMS_TO_SEED) {
    const label = entry.query ?? `tmdb:${entry.tmdbId}`

    try {
      const tmdbId = entry.tmdbId ?? (await searchForTmdbId(entry.query))
      await sleep(REQUEST_DELAY_MS)

      const details = await fetchMovieDetails(tmdbId)
      await sleep(REQUEST_DELAY_MS)

      const { data: existing, error: lookupError } = await supabase
        .from('films')
        .select('id')
        .eq('tmdb_id', tmdbId)
        .maybeSingle()

      if (lookupError) {
        throw lookupError
      }

      if (existing) {
        console.log(`Skipped (already exists): ${details.title}`)
        summary.skipped += 1
        continue
      }

      const film = {
        slug: slugify(details.title),
        title: details.title,
        description: details.overview || null,
        genre: details.genres?.[0]?.name ?? null,
        year: details.release_date ? parseInt(details.release_date.slice(0, 4), 10) : null,
        poster_url: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
        tmdb_id: tmdbId,
      }

      const { error: insertError } = await supabase.from('films').insert(film)

      if (insertError) {
        throw insertError
      }

      console.log(`Added: ${details.title}`)
      summary.inserted += 1
    } catch (err) {
      console.error(`Failed to seed "${label}": ${err.message}`)
      summary.failed += 1
    }
  }

  console.log('\nSeed summary')
  console.log(`  Inserted: ${summary.inserted}`)
  console.log(`  Skipped:  ${summary.skipped}`)
  console.log(`  Failed:   ${summary.failed}`)
}

run()
