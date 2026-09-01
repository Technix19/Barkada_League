// Temporary frontend leaderboard/streak calculations for the mock layer.
//
// The authoritative version of this logic will eventually live in the
// Express API (GET /api/leaderboard, GET /api/players/:id/stats), reading
// from PostgreSQL instead of an in-memory array. This file exists only so
// the mock UI can demonstrate the same derived-data behavior described in
// the project spec (section 19-20) without a backend.

function matchesForSeason(matches, seasonId) {
  return matches.filter((m) => String(m.seasonId) === String(seasonId))
}

function outcomesForPlayer(matches, playerId) {
  return matches
    .filter((m) => m.player1Id === playerId || m.player2Id === playerId)
    .slice()
    .sort((a, b) => {
      if (a.playedAt !== b.playedAt) return b.playedAt.localeCompare(a.playedAt)
      return b.id - a.id
    })
    .map((m) => (m.winnerId === playerId ? 'W' : 'L'))
}

export function calculateStreak(outcomesNewestFirst) {
  if (outcomesNewestFirst.length === 0) {
    return { type: null, count: 0 }
  }
  const type = outcomesNewestFirst[0]
  let count = 0
  for (const outcome of outcomesNewestFirst) {
    if (outcome !== type) break
    count += 1
  }
  return { type, count }
}

export function calculatePlayerStats(matches, players, playerId, seasonId) {
  const seasonMatches = matchesForSeason(matches, seasonId)
  const outcomes = outcomesForPlayer(seasonMatches, playerId)
  const wins = outcomes.filter((o) => o === 'W').length
  const matchesPlayed = outcomes.length
  const losses = matchesPlayed - wins
  const winPercentage = matchesPlayed === 0 ? 0 : Math.round((wins / matchesPlayed) * 100)

  return {
    matchesPlayed,
    wins,
    losses,
    winPercentage,
    currentStreak: calculateStreak(outcomes),
  }
}

export function calculateLeaderboard(matches, players, seasonId) {
  const rows = players.map((player) => {
    const stats = calculatePlayerStats(matches, players, player.id, seasonId)
    return {
      playerId: player.id,
      name: player.name,
      nickname: player.nickname,
      ...stats,
    }
  })

  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    return a.name.localeCompare(b.name)
  })

  return rows.map((row, index) => ({ rank: index + 1, ...row }))
}

export function getRecentMatches(matches, seasonId, limit = 5) {
  return matchesForSeason(matches, seasonId)
    .slice()
    .sort((a, b) => {
      if (a.playedAt !== b.playedAt) return b.playedAt.localeCompare(a.playedAt)
      return b.id - a.id
    })
    .slice(0, limit)
}
