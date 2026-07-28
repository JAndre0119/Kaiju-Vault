import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const ANTHROPIC_MODEL = 'claude-opus-5'
const ANTHROPIC_MAX_TOKENS = 500
const EMPTY_WATCHLIST_MESSAGE =
  'Add some films to your watchlist first, then I can recommend something similar!'

function buildPrompt(films) {
  const list = films
    .map((film) => `- ${film.title}${film.genre ? ` (${film.genre})` : ''}`)
    .join('\n')

  return `Here is a user's kaiju/monster movie watchlist:\n${list}\n\nRecommend exactly one additional kaiju or monster movie they might enjoy that is not already on this list. Respond with just the movie title followed by a one or two sentence reason why, no preamble.`
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

    return res.json({ recommendation: textBlock.text })
  } catch (err) {
    console.error('Failed to get recommendation from Anthropic:', err)
    return res.status(502).json({
      error: "Couldn't get a recommendation right now, please try again in a moment.",
    })
  }
})

export default router
