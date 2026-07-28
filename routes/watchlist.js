import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'

router.use(requireAuth)

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('watchlist')
    .select('film_id, added_at, films(id, slug, title, description, genre, year, poster_url)')
    .eq('user_id', req.user.id)
    .order('added_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  const items = data.map((row) => ({ ...row.films, added_at: row.added_at }))

  return res.json({ watchlist: items })
})

router.post('/', async (req, res) => {
  const { filmId } = req.body ?? {}

  if (!filmId) {
    return res.status(400).json({ error: 'filmId is required.' })
  }

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: req.user.id, film_id: filmId })

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: 'This film is already in your watchlist.' })
    }
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return res.status(400).json({ error: 'Film not found.' })
    }
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  return res.status(201).json({ success: true })
})

router.delete('/:filmId', async (req, res) => {
  const { filmId } = req.params

  const { data, error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', req.user.id)
    .eq('film_id', filmId)
    .select()

  if (error) {
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'This film is not in your watchlist.' })
  }

  return res.json({ success: true })
})

export default router
