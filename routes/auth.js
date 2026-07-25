import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabaseClient.js'
import { getRegisterValidationError, getLoginValidationError } from '../utils/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const SALT_ROUNDS = 12
const JWT_EXPIRES_IN = '24h'
const UNIQUE_VIOLATION = '23505'

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {}

  const validationError = getRegisterValidationError({ username, email, password })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ username: username.trim(), email: email.trim(), password_hash: passwordHash })
    .select('id, username, email, role, created_at')
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: 'An account with this username or email already exists.' })
    }
    return res.status(500).json({ error: 'Something went wrong, please try again.' })
  }

  return res.status(201).json({ user })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  const validationError = getLoginValidationError({ email, password })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, password_hash, role')
    .eq('email', email.trim())
    .maybeSingle()

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })

  return res.json({ token })
})

router.get('/me', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('id', req.user.id)
    .maybeSingle()

  if (error || !user) {
    return res.status(404).json({ error: 'User not found.' })
  }

  return res.json({ user })
})

export default router
