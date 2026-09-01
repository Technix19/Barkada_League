import { Router } from 'express'
import { parsePositiveInt } from '../utils/validation.js'
import { seasonExists, getSeasonStandings } from '../utils/leagueStats.js'

const router = Router()

router.get('/', async (req, res) => {
  const seasonId = parsePositiveInt(req.query.seasonId)
  if (seasonId === null) {
    return res.status(400).json({ error: 'seasonId is required and must be a positive integer' })
  }

  try {
    if (!(await seasonExists(seasonId))) {
      return res.status(404).json({ error: 'Season not found' })
    }

    const standings = await getSeasonStandings(seasonId)
    res.json(standings)
  } catch (err) {
    console.error('GET /api/leaderboard failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
