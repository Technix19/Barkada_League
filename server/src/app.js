import express from 'express'
import cors from 'cors'
import pool from './db.js'
import playersRouter from './routes/players.js'
import seasonsRouter from './routes/seasons.js'
import matchesRouter from './routes/matches.js'
import leaderboardRouter from './routes/leaderboard.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    console.error('Database health check failed:', err.message)
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

app.use('/api/players', playersRouter)
app.use('/api/seasons', seasonsRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/leaderboard', leaderboardRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
