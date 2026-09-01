// Temporary mock data for the Barkada League frontend.
//
// This mirrors the logical seed data in database/seed.sql (same players,
// same season, same 15 matches) so the UI behaves the same way it will
// once it is backed by the real Express + PostgreSQL API. Only the mock
// service layer (src/services/mockApi.js) should import this file.

export const mockPlayers = [
  { id: 1, name: 'Lance', nickname: 'Lan', joinDate: '2026-07-01' },
  { id: 2, name: 'Josh', nickname: null, joinDate: '2026-07-01' },
  { id: 3, name: 'Mark', nickname: null, joinDate: '2026-07-05' },
  { id: 4, name: 'Alex', nickname: null, joinDate: '2026-07-05' },
  { id: 5, name: 'Nico', nickname: null, joinDate: '2026-07-10' },
  { id: 6, name: 'Paolo', nickname: null, joinDate: '2026-07-10' },
]

export const mockSeasons = [
  { id: 1, name: 'Season 1', startDate: '2026-08-01', endDate: null, isActive: true },
]

// Winner ids already agree with the higher score in every row, the same
// rule the real backend will enforce server-side.
export const mockMatches = [
  { id: 1, seasonId: 1, player1Id: 1, player2Id: 2, player1Score: 21, player2Score: 15, winnerId: 1, playedAt: '2026-08-01' },
  { id: 2, seasonId: 1, player1Id: 3, player2Id: 4, player1Score: 21, player2Score: 18, winnerId: 3, playedAt: '2026-08-02' },
  { id: 3, seasonId: 1, player1Id: 5, player2Id: 6, player1Score: 21, player2Score: 19, winnerId: 5, playedAt: '2026-08-03' },
  { id: 4, seasonId: 1, player1Id: 1, player2Id: 3, player1Score: 21, player2Score: 14, winnerId: 1, playedAt: '2026-08-05' },
  { id: 5, seasonId: 1, player1Id: 2, player2Id: 4, player1Score: 21, player2Score: 17, winnerId: 2, playedAt: '2026-08-06' },
  { id: 6, seasonId: 1, player1Id: 5, player2Id: 1, player1Score: 18, player2Score: 21, winnerId: 1, playedAt: '2026-08-08' },
  { id: 7, seasonId: 1, player1Id: 6, player2Id: 2, player1Score: 21, player2Score: 16, winnerId: 6, playedAt: '2026-08-09' },
  { id: 8, seasonId: 1, player1Id: 3, player2Id: 5, player1Score: 21, player2Score: 20, winnerId: 3, playedAt: '2026-08-10' },
  { id: 9, seasonId: 1, player1Id: 4, player2Id: 6, player1Score: 21, player2Score: 13, winnerId: 4, playedAt: '2026-08-12' },
  { id: 10, seasonId: 1, player1Id: 1, player2Id: 2, player1Score: 21, player2Score: 19, winnerId: 1, playedAt: '2026-08-13' },
  { id: 11, seasonId: 1, player1Id: 3, player2Id: 1, player1Score: 17, player2Score: 21, winnerId: 1, playedAt: '2026-08-15' },
  { id: 12, seasonId: 1, player1Id: 4, player2Id: 5, player1Score: 21, player2Score: 15, winnerId: 4, playedAt: '2026-08-16' },
  { id: 13, seasonId: 1, player1Id: 2, player2Id: 3, player1Score: 21, player2Score: 18, winnerId: 2, playedAt: '2026-08-18' },
  { id: 14, seasonId: 1, player1Id: 1, player2Id: 4, player1Score: 21, player2Score: 16, winnerId: 1, playedAt: '2026-08-19' },
  { id: 15, seasonId: 1, player1Id: 6, player2Id: 5, player1Score: 21, player2Score: 17, winnerId: 6, playedAt: '2026-08-20' },
]
