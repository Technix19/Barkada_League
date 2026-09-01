import { Router } from 'express'
import pool from '../db.js'
import { parsePositiveInt } from '../utils/validation.js'
import { seasonExists, getSeasonStandings } from '../utils/leagueStats.js'

const router = Router()

// join_date is cast to text so the pg driver returns a plain "YYYY-MM-DD"
// string instead of a JS Date object -- letting it parse as a Date risks a
// timezone-driven off-by-one-day shift when it is later serialized.
const PLAYER_SELECT = `
  SELECT
    id,
    name,
    nickname,
    join_date::text AS "joinDate"
  FROM players
`

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${PLAYER_SELECT} ORDER BY name ASC`)
    res.json(rows)
  } catch (err) {
    console.error('GET /api/players failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return res.status(400).json({ error: 'Invalid player id' })
  }

  try {
    const { rows } = await pool.query(`${PLAYER_SELECT} WHERE id = $1`, [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('GET /api/players/:id failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Derived per-player season statistics, reusing the exact same computation
// as GET /api/leaderboard (see utils/leagueStats.js) so the two endpoints
// can never disagree. A player who exists but has no matches this season
// still returns 200 with zeroed stats -- only a genuinely unknown player
// id or season id is a 404.
router.get('/:id/stats', async (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return res.status(400).json({ error: 'Invalid player id' })
  }

  const seasonId = parsePositiveInt(req.query.seasonId)
  if (seasonId === null) {
    return res.status(400).json({ error: 'seasonId is required and must be a positive integer' })
  }

  try {
    if (!(await seasonExists(seasonId))) {
      return res.status(404).json({ error: 'Season not found' })
    }

    const standings = await getSeasonStandings(seasonId)
    const entry = standings.find((row) => row.player.id === id)
    if (!entry) {
      return res.status(404).json({ error: 'Player not found' })
    }

    res.json({
      player: entry.player,
      seasonId,
      rank: entry.rank,
      matchesPlayed: entry.matchesPlayed,
      wins: entry.wins,
      losses: entry.losses,
      winPercentage: entry.winPercentage,
      currentStreak: entry.currentStreak,
    })
  } catch (err) {
    console.error('GET /api/players/:id/stats failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
