import '../env.js'

import { supabase } from './supabaseClient.js'
import { searchForTmdbId, fetchMovieDetails, buildFilmRecord } from './tmdb.js'

const REQUEST_DELAY_MS = 250

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

      const film = buildFilmRecord(tmdbId, details)

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
