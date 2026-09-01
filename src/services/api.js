// Real frontend data-access layer, talking to the Express API over HTTP.
// Pages call these functions exactly as they called the equivalents in
// mockApi.js -- this file exists so page/component code needed no changes
// beyond swapping the import.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Central fetch helper: sets JSON headers, parses JSON bodies (skipping
// parsing entirely for a 204 No Content), and turns a non-2xx response
// into a thrown Error whose .message is the backend's own `error` string
// where available -- so callers can show it directly instead of only a
// generic "request failed".
async function request(path, options = {}) {
  const hasBody = options.body !== undefined
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const error = new Error(data?.error || 'Request failed')
    error.status = response.status
    throw error
  }

  return data
}

// The real API returns nested player1/player2/winner objects. MatchCard
// reads a flat match.winnerId, and EditMatchPage reads flat
// match.player1Id/player2Id (mirroring the old mock shape) -- adding
// those alongside the nested objects keeps every consumer working
// unchanged instead of pushing this transport detail into components.
function adaptMatch(match) {
  return {
    ...match,
    player1Id: match.player1.id,
    player2Id: match.player2.id,
    winnerId: match.winner.id,
  }
}

// The real API nests { player: { id, name, nickname } } per leaderboard
// row; LeaderboardRow/LeaderboardTable read flat entry.playerId/name/
// nickname (the old mock shape). Flattened here so those components don't
// need to change.
function adaptLeaderboardEntry(entry) {
  return {
    rank: entry.rank,
    playerId: entry.player.id,
    name: entry.player.name,
    nickname: entry.player.nickname,
    matchesPlayed: entry.matchesPlayed,
    wins: entry.wins,
    losses: entry.losses,
    winPercentage: entry.winPercentage,
    currentStreak: entry.currentStreak,
  }
}

function toMatchPayload(formData) {
  return {
    seasonId: Number(formData.seasonId),
    player1Id: Number(formData.player1Id),
    player2Id: Number(formData.player2Id),
    player1Score: Number(formData.player1Score),
    player2Score: Number(formData.player2Score),
    playedAt: formData.playedAt,
  }
}

// GET /api/players
export async function getPlayers() {
  return request('/players')
}

// GET /api/players/:id
export async function getPlayer(id) {
  try {
    return await request(`/players/${id}`)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

// GET /api/seasons
export async function getSeasons() {
  return request('/seasons')
}

// GET /api/matches?seasonId=
export async function getMatches(seasonId) {
  const matches = await request(`/matches?seasonId=${seasonId}`)
  return matches.map(adaptMatch)
}

// GET /api/matches/:id
export async function getMatch(id) {
  try {
    const match = await request(`/matches/${id}`)
    return adaptMatch(match)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

// POST /api/matches
export async function createMatch(formData) {
  const match = await request('/matches', {
    method: 'POST',
    body: JSON.stringify(toMatchPayload(formData)),
  })
  return adaptMatch(match)
}

// PATCH /api/matches/:id
export async function updateMatch(id, formData) {
  const match = await request(`/matches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toMatchPayload(formData)),
  })
  return adaptMatch(match)
}

// DELETE /api/matches/:id
export async function deleteMatch(id) {
  await request(`/matches/${id}`, { method: 'DELETE' })
}

// GET /api/leaderboard?seasonId=
export async function getLeaderboard(seasonId) {
  const standings = await request(`/leaderboard?seasonId=${seasonId}`)
  return standings.map(adaptLeaderboardEntry)
}

// GET /api/players/:id/stats?seasonId=
export async function getPlayerStats(id, seasonId) {
  return request(`/players/${id}/stats?seasonId=${seasonId}`)
}

// Not a real endpoint -- the backend already returns matches newest-first,
// so "recent matches" is just the first N of GET /api/matches.
export async function getRecentMatchesForSeason(seasonId, limit = 5) {
  const matches = await getMatches(seasonId)
  return matches.slice(0, limit)
}
