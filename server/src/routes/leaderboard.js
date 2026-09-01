import { Router } from 'express'
import pool from '../db.js'
import { parsePositiveInt } from '../utils/validation.js'

const router = Router()

// One query gets every registered player plus their matchesPlayed/wins for
// the selected season in a single pass -- a LEFT JOIN so zero-match players
// still appear (their joined match row is simply NULL), and the join
// condition itself restricts matches to the requested season so no
// cross-season data leaks in. Counts are cast to int; pg would otherwise
// return bigint counts as strings.
const PLAYER_SEASON_STATS = `
  SELECT
    p.id,
    p.name,
    p.nickname,
    COUNT(m.id)::int AS "matchesPlayed",
    COUNT(m.id) FILTER (WHERE m.winner_id = p.id)::int AS wins
  FROM players p
  LEFT JOIN matches m
    ON (m.player1_id = p.id OR m.player2_id = p.id)
    AND m.season_id = $1
  GROUP BY p.id, p.name, p.nickname
`

// Every match in the season, newest first (same tie-breaker as match
// history: played_at DESC, id DESC), used only to derive each player's
// current streak in JavaScript.
const SEASON_MATCH_OUTCOMES = `
  SELECT id, player1_id AS "player1Id", player2_id AS "player2Id", winner_id AS "winnerId"
  FROM matches
  WHERE season_id = $1
  ORDER BY played_at DESC, id DESC
`

function buildOutcomesByPlayer(matches) {
  const outcomesByPlayer = new Map()
  for (const match of matches) {
    for (const playerId of [match.player1Id, match.player2Id]) {
      if (!outcomesByPlayer.has(playerId)) {
        outcomesByPlayer.set(playerId, [])
      }
      outcomesByPlayer.get(playerId).push(match.winnerId === playerId ? 'W' : 'L')
    }
  }
  return outcomesByPlayer
}

function calculateStreak(outcomesNewestFirst) {
  if (!outcomesNewestFirst || outcomesNewestFirst.length === 0) {
    return null
  }
  const type = outcomesNewestFirst[0]
  let count = 0
  for (const outcome of outcomesNewestFirst) {
    if (outcome !== type) break
    count += 1
  }
  return { type, count }
}

function calculateWinPercentage(wins, matchesPlayed) {
  if (matchesPlayed === 0) return 0
  return Math.round((wins / matchesPlayed) * 10000) / 100
}

router.get('/', async (req, res) => {
  const seasonId = parsePositiveInt(req.query.seasonId)
  if (seasonId === null) {
    return res.status(400).json({ error: 'seasonId is required and must be a positive integer' })
  }

  try {
    const seasonResult = await pool.query('SELECT 1 FROM seasons WHERE id = $1', [seasonId])
    if (seasonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' })
    }

    const [statsResult, matchesResult] = await Promise.all([
      pool.query(PLAYER_SEASON_STATS, [seasonId]),
      pool.query(SEASON_MATCH_OUTCOMES, [seasonId]),
    ])

    const outcomesByPlayer = buildOutcomesByPlayer(matchesResult.rows)

    const standings = statsResult.rows.map((row) => {
      const losses = row.matchesPlayed - row.wins
      return {
        player: { id: row.id, name: row.name, nickname: row.nickname },
        matchesPlayed: row.matchesPlayed,
        wins: row.wins,
        losses,
        winPercentage: calculateWinPercentage(row.wins, row.matchesPlayed),
        currentStreak: calculateStreak(outcomesByPlayer.get(row.id)),
        _name: row.name,
      }
    })

    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
      return a._name.localeCompare(b._name)
    })

    const ranked = standings.map((entry, index) => {
      const { _name, ...rest } = entry
      return { rank: index + 1, ...rest }
    })

    res.json(ranked)
  } catch (err) {
    console.error('GET /api/leaderboard failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
