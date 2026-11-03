import { supabase } from '../auth/supabase.js'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export async function request(path, options = {}) {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(data.session?.access_token ? { Authorization: 'Bearer ' + data.session.access_token } : {}),
    ...options.headers,
  }

  let response
  try {
    response = await fetch(API_BASE + '/api' + path, { ...options, headers })
  } catch {
    throw new Error('Cannot connect to the server. Please try again.')
  }

  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error || 'Request failed')
    error.status = response.status
    throw error
  }
  return body
}

const leagueUrl = (leagueId, suffix = '') => '/leagues/' + encodeURIComponent(leagueId) + suffix
const adaptMatch = (match) => ({
  ...match, player1Id: match.player1.id, player2Id: match.player2.id, winnerId: match.winner.id,
})
const adaptStandings = (entry) => ({
  rank: entry.rank, playerId: entry.player.id, name: entry.player.name,
  nickname: entry.player.nickname, matchesPlayed: entry.matchesPlayed,
  wins: entry.wins, losses: entry.losses, winPercentage: entry.winPercentage,
  currentStreak: entry.currentStreak, longestWinStreak: entry.longestWinStreak,
})
const payload = (values) => ({
  seasonId: Number(values.seasonId),
  player1Id: Number(values.player1Id),
  player2Id: Number(values.player2Id),
  player1Score: Number(values.player1Score),
  player2Score: Number(values.player2Score),
  playedAt: values.playedAt,
})

export const getMyLeagues = () => request('/leagues')
export const getDemoLeague = () => request('/leagues/demo')
export const getLeague = (id) => request(leagueUrl(id))
export const createLeague = (values) => request('/leagues', {
  method: 'POST', body: JSON.stringify(values),
})

export const getPlayers = (id) => request(leagueUrl(id, '/players'))
export const createPlayer = (id, values) => request(leagueUrl(id, '/players'), {
  method: 'POST', body: JSON.stringify(values),
})
export async function getPlayer(id, playerId) {
  try { return await request(leagueUrl(id, '/players/' + playerId)) }
  catch (error) { if (error.status === 404) return null; throw error }
}
export const getSeasons = (id) => request(leagueUrl(id, '/seasons'))
export const createSeason = (id, values) => request(leagueUrl(id, '/seasons'), {
  method: 'POST', body: JSON.stringify(values),
})
export const activateSeason = (id, seasonId) => request(leagueUrl(id, '/seasons/' + seasonId + '/activate'), {
  method: 'PATCH',
})

export async function getMatches(id, seasonId, limit = 25, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (seasonId) params.set('seasonId', seasonId)
  const matches = await request(leagueUrl(id, '/matches?' + params.toString()))
  return matches.map(adaptMatch)
}
export async function getMatch(id, matchId) {
  try {
    return adaptMatch(await request(leagueUrl(id, '/matches/' + matchId)))
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}
export async function createMatch(id, values) {
  return adaptMatch(await request(leagueUrl(id, '/matches'), {
    method: 'POST', body: JSON.stringify(payload(values)),
  }))
}
export async function updateMatch(id, matchId, values) {
  return adaptMatch(await request(leagueUrl(id, '/matches/' + matchId), {
    method: 'PATCH', body: JSON.stringify(payload(values)),
  }))
}
export const deleteMatch = (id, matchId) => request(leagueUrl(id, '/matches/' + matchId), {
  method: 'DELETE',
})
export async function getLeaderboard(id, seasonId) {
  const data = await request(leagueUrl(id, '/leaderboard?seasonId=' + encodeURIComponent(seasonId)))
  return data.map(adaptStandings)
}
export const getPlayerStats = (id, playerId, seasonId) =>
  request(leagueUrl(id, '/players/' + playerId + '/stats?seasonId=' + encodeURIComponent(seasonId)))
export async function getPlayerMatches(id, playerId, seasonId) {
  const data = await request(leagueUrl(id, '/players/' + playerId +
    '/matches?seasonId=' + encodeURIComponent(seasonId)))
  return data.map(adaptMatch)
}
export const getRecentMatchesForSeason = (id, seasonId, limit = 5) =>
  getMatches(id, seasonId, limit, 0)
