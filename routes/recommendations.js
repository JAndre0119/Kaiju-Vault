import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { searchForTmdbId, fetchMovieDetails, buildFilmRecord } from '../db/tmdb.js'

const router = Router()

const ANTHROPIC_MODEL = 'claude-opus-5'
const ANTHROPIC_MAX_TOKENS = 500
const UNIQUE_VIOLATION = '23505'
const EMPTY_WATCHLIST_MESSAGE =
  'Add some films to your watchlist first, then I can recommend something similar!'

const FILM_COLUMNS = 'id, slug, title, description, genre, year, poster_url, tmdb_id'

function buildPrompt(films) {
  const list = films
    .map((film) => `- ${film.title}${film.genre ? ` (${film.genre})` : ''}`)
    .join('\n')

  return `Here is a user's kaiju/monster movie watchlist:\n${list}\n\nRecommend exactly one additional kaiju or monster movie they might enjoy that is not already on this list.\n\nYour entire response must be exactly two lines, in this literal format, with no markdown, no bold, no asterisks, no year, and no other commentary before or after:\nTITLE: <the movie title only>\nREASON: <a one or two sentence reason why>`
}

function stripMarkdown(text) {
  return text.replace(/\*+/g, '').trim()
}

function parseRecommendation(text) {
  const titleMatch = text.match(/TITLE:\s*(.+)/i)
  const reasonMatch = text.match(/REASON:\s*([\s\S]+)/i)

  if (titleMatch) {
    return {
      title: stripMarkdown(titleMatch[1]).replace(/\s*\(\d{4}\)\s*$/, '').trim(),
      reason: reasonMatch ? stripMarkdown(reasonMatch[1]) : stripMarkdown(text),
    }
  }

  // The model ignored the requested format — fall back to pulling a title out
  // of the first line, which models tend to write as "Title (Year) — reason".
  const firstLine = stripMarkdown(text.split('\n')[0])
  const fallbackMatch = firstLine.match(/^([^—:-]+?)(?:\s*\(\d{4}\))?\s*(?:[—:-]|$)/)

  return {
    title: fallbackMatch ? fallbackMatch[1].trim() : null,
    reason: stripMarkdown(text),
  }
}

async function findOrCreateFilmByTitle(title) {
  const { data: existing, error: lookupError } = await supabase
    .from('films')
    .select(FILM_COLUMNS)
    .ilike('title', title)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (existing) {
    return existing
  }

  const searchQuery = title.replace(/\s*\(\d{4}\)\s*$/, '').trim()
  const tmdbId = await searchForTmdbId(searchQuery)
  const details = await fetchMovieDetails(tmdbId)
  const film = buildFilmRecord(tmdbId, details)

  const { data: inserted, error: insertError } = await supabase
    .from('films')
    .insert(film)
    .select(FILM_COLUMNS)
    .single()

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) {
      const { data: raceFilm, error: raceError } = await supabase
        .from('films')
        .select(FILM_COLUMNS)
        .eq('tmdb_id', tmdbId)
        .maybeSingle()

      if (raceError || !raceFilm) {
        throw insertError
      }

      return raceFilm
    }

    throw insertError
  }

  return inserted
}

router.post('/', requireAuth, async (req, res) => {
  const { data: watchlist, error: watchlistError } = await supabase
    .from('watchlist')
    .select('films(title, genre)')
    .eq('user_id', req.user.id)

  if (watchlistError) {
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  const films = watchlist.map((row) => row.films)

  if (films.length === 0) {
    return res.json({ message: EMPTY_WATCHLIST_MESSAGE })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        messages: [{ role: 'user', content: buildPrompt(films) }],
      }),
    })

    if (!anthropicRes.ok) {
      const errorBody = await anthropicRes.text()
      throw new Error(`Anthropic API returned ${anthropicRes.status}: ${errorBody}`)
    }

    const data = await anthropicRes.json()

    if (data.stop_reason === 'refusal') {
      throw new Error(`Anthropic API refused the request: ${JSON.stringify(data.stop_details)}`)
    }

    const textBlock = data.content.find((block) => block.type === 'text')

    if (!textBlock) {
      throw new Error('Anthropic API response contained no text block')
    }

    const { title, reason } = parseRecommendation(textBlock.text)

    let film = null
    if (title) {
      try {
        film = await findOrCreateFilmByTitle(title)
      } catch (filmErr) {
        // Non-fatal: still return the text recommendation, just without a linkable film.
        console.error(`Failed to resolve recommended film "${title}":`, filmErr)
      }
    }

    return res.json({ recommendation: reason, title, film })
  } catch (err) {
    console.error('Failed to get recommendation from Anthropic:', err)
    return res.status(502).json({
      error: "Couldn't get a recommendation right now, please try again in a moment.",
    })
  }
})

export default router
