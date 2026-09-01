import { Router } from 'express'
import pool from '../db.js'
import { parsePositiveInt } from '../utils/validation.js'
import {
  MATCH_FIELDS,
  checkBodyShape,
  validateCompleteMatch,
  deriveWinnerId,
} from '../utils/validateMatch.js'

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

// Confirms the season and both players referenced by a match actually
// exist, returning a clear message for whichever one is missing (or null
// if all three are fine). Application-level check ahead of the foreign
// keys, which remain the backup safety layer.
async function findMissingReference({ seasonId, player1Id, player2Id }) {
  const [seasonResult, player1Result, player2Result] = await Promise.all([
    pool.query('SELECT 1 FROM seasons WHERE id = $1', [seasonId]),
    pool.query('SELECT 1 FROM players WHERE id = $1', [player1Id]),
    pool.query('SELECT 1 FROM players WHERE id = $1', [player2Id]),
  ])
  if (seasonResult.rows.length === 0) return 'Season does not exist'
  if (player1Result.rows.length === 0) return 'Player 1 does not exist'
  if (player2Result.rows.length === 0) return 'Player 2 does not exist'
  return null
}

router.post('/', async (req, res) => {
  const shapeError = checkBodyShape(req.body)
  if (shapeError) {
    return res.status(400).json({ error: shapeError })
  }

  const match = {
    seasonId: req.body.seasonId,
    player1Id: req.body.player1Id,
    player2Id: req.body.player2Id,
    player1Score: req.body.player1Score,
    player2Score: req.body.player2Score,
    playedAt: req.body.playedAt,
  }

  const validationError = validateCompleteMatch(match)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const missingRefError = await findMissingReference(match)
    if (missingRefError) {
      return res.status(400).json({ error: missingRefError })
    }

    const winnerId = deriveWinnerId(match)
    const inserted = await pool.query(
      `INSERT INTO matches
        (season_id, player1_id, player2_id, player1_score, player2_score, winner_id, played_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [match.seasonId, match.player1Id, match.player2Id, match.player1Score, match.player2Score, winnerId, match.playedAt],
    )

    const { rows } = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [inserted.rows[0].id])
    res.status(201).json(mapMatchRow(rows[0]))
  } catch (err) {
    console.error('POST /api/matches failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', async (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return res.status(400).json({ error: 'Invalid match id' })
  }

  const shapeError = checkBodyShape(req.body)
  if (shapeError) {
    return res.status(400).json({ error: shapeError })
  }

  const providedFields = MATCH_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
  if (providedFields.length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' })
  }

  try {
    const existingResult = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [id])
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' })
    }
    const existing = existingResult.rows[0]

    // Merge only the fields the client actually sent over the existing
    // values, then validate the resulting COMPLETE match. A field sent
    // as null overrides the existing value and correctly fails
    // validation rather than being treated as "leave unchanged".
    const merged = {
      seasonId: existing.seasonId,
      player1Id: existing.player1Id,
      player2Id: existing.player2Id,
      player1Score: existing.player1Score,
      player2Score: existing.player2Score,
      playedAt: existing.playedAt,
    }
    for (const field of providedFields) {
      merged[field] = req.body[field]
    }

    const validationError = validateCompleteMatch(merged)
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const missingRefError = await findMissingReference(merged)
    if (missingRefError) {
      return res.status(400).json({ error: missingRefError })
    }

    const winnerId = deriveWinnerId(merged)
    await pool.query(
      `UPDATE matches
       SET season_id = $1, player1_id = $2, player2_id = $3,
           player1_score = $4, player2_score = $5, winner_id = $6, played_at = $7
       WHERE id = $8`,
      [merged.seasonId, merged.player1Id, merged.player2Id, merged.player1Score, merged.player2Score, winnerId, merged.playedAt, id],
    )

    const { rows } = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [id])
    res.json(mapMatchRow(rows[0]))
  } catch (err) {
    console.error('PATCH /api/matches/:id failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return res.status(400).json({ error: 'Invalid match id' })
  }

  try {
    const { rows } = await pool.query('DELETE FROM matches WHERE id = $1 RETURNING id', [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' })
    }
    res.status(204).end()
  } catch (err) {
    console.error('DELETE /api/matches/:id failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
