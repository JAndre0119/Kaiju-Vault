import './env.js'

import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import filmsRouter from './routes/films.js'
import watchlistRouter from './routes/watchlist.js'
import recommendationsRouter from './routes/recommendations.js'

const app = express()

// FRONTEND_URL unset (e.g. before Vercel gives you a URL) → allow any origin.
// Once set, restrict to it plus local dev, rather than staying wide open.
const corsOptions = process.env.FRONTEND_URL
  ? { origin: ['http://localhost:5173', process.env.FRONTEND_URL] }
  : { origin: '*' }

app.use(cors(corsOptions))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/films', filmsRouter)
app.use('/watchlist', watchlistRouter)
app.use('/recommendations', recommendationsRouter)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Kaiju Vault API listening on port ${port}`)
})
