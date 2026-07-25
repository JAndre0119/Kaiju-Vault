import './env.js'

import express from 'express'
import authRouter from './routes/auth.js'

const app = express()
app.use(express.json())

app.use('/auth', authRouter)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Kaiju Vault API listening on port ${port}`)
})
