import './env.js'

import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import filmsRouter from './routes/films.js'
import watchlistRouter from './routes/watchlist.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', authRouter)
app.use('/films', filmsRouter)
app.use('/watchlist', watchlistRouter)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Kaiju Vault API listening on port ${port}`)
})
