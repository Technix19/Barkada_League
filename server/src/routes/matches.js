import { Router } from 'express'
import pool from '../db.js'
import { parsePositiveInt } from '../utils/validation.js'

const router = Router()

// played_at is cast to text for the same reason as players.join_date --
// avoids the pg driver's DATE-to-JS-Date timezone shift.
const MATCH_SELECT = `
  SELECT
    m.id,
    m.season_id AS "seasonId",
    m.player1_score AS "player1Score",
    m.player2_score AS "player2Score",
    m.played_at::text AS "playedAt",
    m.created_at AS "createdAt",
    p1.id AS "player1Id",
    p1.name AS "player1Name",
    p1.nickname AS "player1Nickname",
    p2.id AS "player2Id",
    p2.name AS "player2Name",
    p2.nickname AS "player2Nickname",
    w.id AS "winnerId",
    w.name AS "winnerName",
    w.nickname AS "winnerNickname"
  FROM matches m
  JOIN players p1 ON p1.id = m.player1_id
  JOIN players p2 ON p2.id = m.player2_id
  JOIN players w ON w.id = m.winner_id
`

function mapMatchRow(row) {
  return {
    id: row.id,
    seasonId: row.seasonId,
    player1: { id: row.player1Id, name: row.player1Name, nickname: row.player1Nickname },
    player2: { id: row.player2Id, name: row.player2Name, nickname: row.player2Nickname },
    player1Score: row.player1Score,
    player2Score: row.player2Score,
    winner: { id: row.winnerId, name: row.winnerName, nickname: row.winnerNickname },
    playedAt: row.playedAt,
    createdAt: row.createdAt,
  }
}

router.get('/', async (req, res) => {
  const { seasonId } = req.query
  let parsedSeasonId = null

  if (seasonId !== undefined) {
    parsedSeasonId = parsePositiveInt(seasonId)
    if (parsedSeasonId === null) {
      return res.status(400).json({ error: 'Invalid seasonId' })
    }
  }

  try {
    const whereClause = parsedSeasonId !== null ? 'WHERE m.season_id = $1' : ''
    const params = parsedSeasonId !== null ? [parsedSeasonId] : []
    const { rows } = await pool.query(
      `${MATCH_SELECT} ${whereClause} ORDER BY m.played_at DESC, m.id DESC`,
      params,
    )
    res.json(rows.map(mapMatchRow))
  } catch (err) {
    console.error('GET /api/matches failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return res.status(400).json({ error: 'Invalid match id' })
  }

  try {
    const { rows } = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' })
    }
    res.json(mapMatchRow(rows[0]))
  } catch (err) {
    console.error('GET /api/matches/:id failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
