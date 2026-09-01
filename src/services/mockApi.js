// Temporary mock service layer.
//
// Pages call these functions, never the mock data arrays directly. Every
// function returns a Promise so calling code already behaves the way it
// will once these bodies are replaced with fetch() calls to the real
// Express API (see project spec section 27). A short simulated delay is
// included so loading states are actually visible during development;
// it is not meant to represent real network latency.
//
// WHEN SWITCHING TO THE REAL API:
// Replace the body of each function below with a fetch() call to the
// matching Express route (noted in each comment). Page/component code
// that calls these functions should not need to change.

import { mockPlayers, mockSeasons, mockMatches } from '../data/mockData.js'
import { calculateLeaderboard, calculatePlayerStats, getRecentMatches } from '../utils/leagueStats.js'
import { validateMatchForm, deriveWinnerId } from '../utils/validateMatch.js'

// In-memory "database". Cloned once per page load so repeated edits during
// a session behave like a real backend without mutating the seed constants.
let players = mockPlayers.map((p) => ({ ...p }))
let seasons = mockSeasons.map((s) => ({ ...s }))
let matches = mockMatches.map((m) => ({ ...m }))
let nextMatchId = matches.reduce((max, m) => Math.max(max, m.id), 0) + 1

function delay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findPlayer(id) {
  return players.find((p) => String(p.id) === String(id)) || null
}

function attachPlayers(match) {
  return {
    ...match,
    player1: findPlayer(match.player1Id),
    player2: findPlayer(match.player2Id),
  }
}

// GET /api/players
export async function getPlayers() {
  await delay()
  return players.map((p) => ({ ...p }))
}

// GET /api/players/:id
export async function getPlayer(id) {
  await delay()
  const player = findPlayer(id)
  return player ? { ...player } : null
}

// GET /api/seasons
export async function getSeasons() {
  await delay()
  return seasons.map((s) => ({ ...s }))
}

// GET /api/matches?seasonId=
export async function getMatches(seasonId) {
  await delay()
  return matches
    .filter((m) => String(m.seasonId) === String(seasonId))
    .slice()
    .sort((a, b) => {
      if (a.playedAt !== b.playedAt) return b.playedAt.localeCompare(a.playedAt)
      return b.id - a.id
    })
    .map(attachPlayers)
}

// GET /api/matches/:id
export async function getMatch(id) {
  await delay()
  const match = matches.find((m) => String(m.id) === String(id))
  return match ? attachPlayers(match) : null
}

// POST /api/matches
export async function createMatch(formData) {
  await delay()
  const errors = validateMatchForm(formData, { players, seasons })
  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed')
    error.fieldErrors = errors
    throw error
  }

  const newMatch = {
    id: nextMatchId++,
    seasonId: Number(formData.seasonId),
    player1Id: Number(formData.player1Id),
    player2Id: Number(formData.player2Id),
    player1Score: Number(formData.player1Score),
    player2Score: Number(formData.player2Score),
    winnerId: deriveWinnerId(formData),
    playedAt: formData.playedAt,
  }
  matches.push(newMatch)
  return attachPlayers(newMatch)
}

// PATCH /api/matches/:id
export async function updateMatch(id, formData) {
  await delay()
  const existing = matches.find((m) => String(m.id) === String(id))
  if (!existing) {
    const error = new Error('Match not found')
    error.status = 404
    throw error
  }

  const errors = validateMatchForm(formData, { players, seasons })
  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed')
    error.fieldErrors = errors
    throw error
  }

  const updated = {
    ...existing,
    seasonId: Number(formData.seasonId),
    player1Id: Number(formData.player1Id),
    player2Id: Number(formData.player2Id),
    player1Score: Number(formData.player1Score),
    player2Score: Number(formData.player2Score),
    winnerId: deriveWinnerId(formData),
    playedAt: formData.playedAt,
  }

  matches = matches.map((m) => (String(m.id) === String(id) ? updated : m))
  return attachPlayers(updated)
}

// DELETE /api/matches/:id
export async function deleteMatch(id) {
  await delay()
  const exists = matches.some((m) => String(m.id) === String(id))
  if (!exists) {
    const error = new Error('Match not found')
    error.status = 404
    throw error
  }
  matches = matches.filter((m) => String(m.id) !== String(id))
}

// GET /api/leaderboard?seasonId=
export async function getLeaderboard(seasonId) {
  await delay()
  return calculateLeaderboard(matches, players, seasonId)
}

// GET /api/players/:id/stats?seasonId=
export async function getPlayerStats(id, seasonId) {
  await delay()
  return calculatePlayerStats(matches, players, Number(id), seasonId)
}

// Convenience helper built on getMatches — kept here since the mock layer
// already holds the season-filtered list; the real API may fold this into
// GET /api/matches or GET /api/leaderboard.
export async function getRecentMatchesForSeason(seasonId, limit = 5) {
  await delay()
  return getRecentMatches(matches, seasonId, limit).map(attachPlayers)
}
