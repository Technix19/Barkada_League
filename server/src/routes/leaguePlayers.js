import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import { isValidDate } from "../utils/validateMatch.js";
import { getSeasonStandings } from "../utils/leagueStats.js";
import { requireLeagueManager } from "../middleware/leagueAccess.js";
import { MATCH_SELECT, mapMatchRow } from "../utils/matchRows.js";

const router = Router({ mergeParams: true });
const PLAYER_SELECT = "SELECT id, name, nickname, join_date::text AS \"joinDate\" FROM players";

router.get("/", async (req, res) => {
  try {
    const rows = await pool.query(
      PLAYER_SELECT + " WHERE league_id = $1 ORDER BY name ASC, id ASC",
      [req.league.id],
    );
    res.json(rows.rows);
  } catch (error) {
    console.error("List players failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireLeagueManager, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["name", "nickname", "joinDate"].includes(key))) {
    return res.status(400).json({ error: "Invalid player fields" });
  }
  const { name, nickname = null, joinDate = null } = body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
      (nickname !== null && (typeof nickname !== "string" || nickname.trim().length > 100)) ||
      (joinDate !== null && !isValidDate(joinDate))) {
    return res.status(400).json({ error: "Invalid player name, nickname or join date" });
  }
  try {
    const inserted = await pool.query(
      "INSERT INTO players (league_id, name, nickname, join_date) " +
      "VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE)) RETURNING id",
      [req.league.id, name.trim(), nickname === null ? null : nickname.trim() || null, joinDate],
    );
    const result = await pool.query(
      PLAYER_SELECT + " WHERE league_id = $1 AND id = $2",
      [req.league.id, inserted.rows[0].id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create player failed:", error.message);
    res.status(500).json({ error: "Could not create player" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid player id" });
  try {
    const result = await pool.query(
      PLAYER_SELECT + " WHERE league_id = $1 AND id = $2", [req.league.id, id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Player not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get player failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/stats", async (req, res) => {
  const playerId = parsePositiveInt(req.params.id);
  const seasonId = parsePositiveInt(req.query.seasonId);
  if (!playerId || !seasonId) {
    return res.status(400).json({ error: "Valid player id and seasonId required" });
  }
  try {
    const season = await pool.query(
      "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
      [seasonId, req.league.id],
    );
    if (!season.rowCount) return res.status(404).json({ error: "Season not found" });
    const standings = await getSeasonStandings(seasonId, req.league.id);
    const result = standings.find((entry) => entry.player.id === playerId);
    if (!result) return res.status(404).json({ error: "Player not found" });
    res.json({ player: result.player, seasonId, rank: result.rank,
      matchesPlayed: result.matchesPlayed, wins: result.wins,
      losses: result.losses, winPercentage: result.winPercentage,
      currentStreak: result.currentStreak, longestWinStreak: result.longestWinStreak });
  } catch (error) {
    console.error("Player stats failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/matches", async (req, res) => {
  const playerId = parsePositiveInt(req.params.id);
  const seasonId = req.query.seasonId === undefined ? null : parsePositiveInt(req.query.seasonId);
  if (!playerId || (req.query.seasonId !== undefined && !seasonId)) {
    return res.status(400).json({ error: "Invalid player id or seasonId" });
  }
  try {
    const player = await pool.query(
      "SELECT id FROM players WHERE id = $1 AND league_id = $2",
      [playerId, req.league.id],
    );
    if (!player.rowCount) return res.status(404).json({ error: "Player not found" });
    let sql = MATCH_SELECT + " WHERE m.league_id = $1 AND (m.player1_id = $2 OR m.player2_id = $2)";
    const params = [req.league.id, playerId];
    if (seasonId) {
      const season = await pool.query(
        "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
        [seasonId, req.league.id],
      );
      if (!season.rowCount) return res.status(404).json({ error: "Season not found" });
      sql += " AND m.season_id = $3";
      params.push(seasonId);
    }
    const result = await pool.query(sql + " ORDER BY m.played_at DESC, m.id DESC", params);
    res.json(result.rows.map(mapMatchRow));
  } catch (error) {
    console.error("Player matches failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/vs/:opponentId", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const opponentId = parsePositiveInt(req.params.opponentId);
  const seasonId = req.query.seasonId === undefined ? null : parsePositiveInt(req.query.seasonId);
  if (!id || !opponentId || id === opponentId ||
      (req.query.seasonId !== undefined && !seasonId)) {
    return res.status(400).json({ error: "Invalid players or seasonId" });
  }
  try {
    const players = await pool.query(
      "SELECT id, name, nickname FROM players WHERE league_id = $1 AND id IN ($2, $3)",
      [req.league.id, id, opponentId],
    );
    if (players.rowCount !== 2) return res.status(404).json({ error: "Player not found" });
    let sql = MATCH_SELECT + " WHERE m.league_id = $1 " +
      "AND ((m.player1_id = $2 AND m.player2_id = $3) " +
      "OR (m.player1_id = $3 AND m.player2_id = $2))";
    const params = [req.league.id, id, opponentId];
    if (seasonId) {
      const season = await pool.query(
        "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
        [seasonId, req.league.id],
      );
      if (!season.rowCount) return res.status(404).json({ error: "Season not found" });
      sql += " AND m.season_id = $4";
      params.push(seasonId);
    }
    const result = await pool.query(sql + " ORDER BY m.played_at DESC, m.id DESC", params);
    const matches = result.rows.map(mapMatchRow);
    const first = players.rows.find((p) => p.id === id);
    const second = players.rows.find((p) => p.id === opponentId);
    res.json({
      summary: {
        totalMatches: matches.length,
        player: { ...first, wins: matches.filter((m) => m.winner.id === id).length },
        opponent: { ...second, wins: matches.filter((m) => m.winner.id === opponentId).length },
      },
      matches,
    });
  } catch (error) {
    console.error("Head to head failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
