// A single shape for every match returned to the React app.
export const MATCH_SELECT = [
  "SELECT m.id, m.season_id AS \"seasonId\",",
  "m.player1_score AS \"player1Score\", m.player2_score AS \"player2Score\",",
  "m.played_at::text AS \"playedAt\", m.created_at AS \"createdAt\",",
  "p1.id AS \"player1Id\", p1.name AS \"player1Name\", p1.nickname AS \"player1Nickname\",",
  "p2.id AS \"player2Id\", p2.name AS \"player2Name\", p2.nickname AS \"player2Nickname\",",
  "w.id AS \"winnerId\", w.name AS \"winnerName\", w.nickname AS \"winnerNickname\"",
  "FROM matches m",
  "JOIN players p1 ON p1.id = m.player1_id AND p1.league_id = m.league_id",
  "JOIN players p2 ON p2.id = m.player2_id AND p2.league_id = m.league_id",
  "JOIN players w ON w.id = m.winner_id AND w.league_id = m.league_id",
].join(" ");

export function mapMatchRow(row) {
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
  };
}
