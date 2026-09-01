// Shared derived-statistics logic for GET /api/leaderboard and
// GET /api/players/:id/stats. Both endpoints call getSeasonStandings() so
// there is exactly one implementation of the ranking/streak/win-percentage
// rules -- a player's numbers can never disagree between the two routes.

import pool from '../db.js'

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

export function calculateStreak(outcomesNewestFirst) {
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

export function calculateWinPercentage(wins, matchesPlayed) {
  if (matchesPlayed === 0) return 0
  return Math.round((wins / matchesPlayed) * 10000) / 100
}

export async function seasonExists(seasonId) {
  const result = await pool.query('SELECT 1 FROM seasons WHERE id = $1', [seasonId])
  return result.rows.length > 0
}

// Returns every registered player's derived season stats, ranked in
// leaderboard order (wins DESC, winPercentage DESC, matchesPlayed DESC,
// name ASC). Assumes the caller has already verified the season exists.
export async function getSeasonStandings(seasonId) {
  const [statsResult, matchesResult] = await Promise.all([
    pool.query(PLAYER_SEASON_STATS, [seasonId]),
    pool.query(SEASON_MATCH_OUTCOMES, [seasonId]),
  ])

  const outcomesByPlayer = buildOutcomesByPlayer(matchesResult.rows)

  const standings = statsResult.rows.map((row) => ({
    player: { id: row.id, name: row.name, nickname: row.nickname },
    matchesPlayed: row.matchesPlayed,
    wins: row.wins,
    losses: row.matchesPlayed - row.wins,
    winPercentage: calculateWinPercentage(row.wins, row.matchesPlayed),
    currentStreak: calculateStreak(outcomesByPlayer.get(row.id)),
  }))

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    return a.player.name.localeCompare(b.player.name)
  })

  return standings.map((entry, index) => ({ rank: index + 1, ...entry }))
}
