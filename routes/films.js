import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data: films, error } = await supabase
    .from('films')
    .select('id, slug, title, description, genre, year, poster_url, tmdb_id')
    .order('title', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  return res.json({ films })
})

export default router
