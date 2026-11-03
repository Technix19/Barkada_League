import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import {
  MATCH_FIELDS, checkBodyShape, validateCompleteMatch, deriveWinnerId,
} from "../utils/validateMatch.js";
import { requireLeagueManager } from "../middleware/leagueAccess.js";
import { MATCH_SELECT, mapMatchRow } from "../utils/matchRows.js";

const router = Router({ mergeParams: true });

function payload(body) {
  return {
    seasonId: body.seasonId,
    player1Id: body.player1Id,
    player2Id: body.player2Id,
    player1Score: body.player1Score,
    player2Score: body.player2Score,
    playedAt: body.playedAt,
  };
}

async function referencesBelongToLeague(match, leagueId) {
  const season = await pool.query(
    "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
    [match.seasonId, leagueId],
  );
  if (!season.rowCount) return "Season is not part of this league";

  const players = await pool.query(
    "SELECT id FROM players WHERE league_id = $1 AND id IN ($2, $3)",
    [leagueId, match.player1Id, match.player2Id],
  );
  if (players.rowCount !== 2) return "Both players must belong to this league";
  return null;
}

async function readMatch(id, leagueId) {
  const result = await pool.query(
    MATCH_SELECT + " WHERE m.id = $1 AND m.league_id = $2", [id, leagueId],
  );
  return result.rows[0] ? mapMatchRow(result.rows[0]) : null;
}

router.get("/", async (req, res) => {
  const seasonId = req.query.seasonId === undefined ? null : parsePositiveInt(req.query.seasonId);
  if (req.query.seasonId !== undefined && !seasonId) {
    return res.status(400).json({ error: "Invalid seasonId" });
  }
  const limit = req.query.limit === undefined ? 100 : parsePositiveInt(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!limit || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) {
    return res.status(400).json({ error: "limit must be 1-100 and offset must be nonnegative" });
  }
  try {
    const params = [req.league.id];
    let query = MATCH_SELECT + " WHERE m.league_id = $1";
    if (seasonId) {
      query += " AND m.season_id = $2";
      params.push(seasonId);
    }
    params.push(limit, offset);
    const limitParam = params.length - 1;
    const offsetParam = params.length;
    query += " ORDER BY m.played_at DESC, m.id DESC LIMIT $" + limitParam +
      " OFFSET $" + offsetParam;
    const result = await pool.query(query, params);
    res.json(result.rows.map(mapMatchRow));
  } catch (error) {
    console.error("List matches failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid match id" });
  try {
    const match = await readMatch(id, req.league.id);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (error) {
    console.error("Get match failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireLeagueManager, async (req, res) => {
  const shapeError = checkBodyShape(req.body);
  if (shapeError) return res.status(400).json({ error: shapeError });
  const match = payload(req.body);
  const validationError = validateCompleteMatch(match);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const referenceError = await referencesBelongToLeague(match, req.league.id);
    if (referenceError) return res.status(400).json({ error: referenceError });
    const result = await pool.query(
      "INSERT INTO matches (league_id, season_id, player1_id, player2_id, " +
      "player1_score, player2_score, winner_id, played_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [req.league.id, match.seasonId, match.player1Id, match.player2Id,
        match.player1Score, match.player2Score, deriveWinnerId(match), match.playedAt],
    );
    res.status(201).json(await readMatch(result.rows[0].id, req.league.id));
  } catch (error) {
    console.error("Create match failed:", error.message);
    res.status(500).json({ error: "Could not create match" });
  }
});

router.patch("/:id", requireLeagueManager, async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid match id" });
  const shapeError = checkBodyShape(req.body);
  if (shapeError) return res.status(400).json({ error: shapeError });
  const provided = MATCH_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(req.body, field));
  if (!provided.length) return res.status(400).json({ error: "No fields to update" });

  try {
    const existing = await readMatch(id, req.league.id);
    if (!existing) return res.status(404).json({ error: "Match not found" });
    const updated = {
      seasonId: existing.seasonId,
      player1Id: existing.player1.id,
      player2Id: existing.player2.id,
      player1Score: existing.player1Score,
      player2Score: existing.player2Score,
      playedAt: existing.playedAt,
    };
    for (const field of provided) updated[field] = req.body[field];

    const error = validateCompleteMatch(updated);
    if (error) return res.status(400).json({ error });
    const referenceError = await referencesBelongToLeague(updated, req.league.id);
    if (referenceError) return res.status(400).json({ error: referenceError });

    const result = await pool.query(
      "UPDATE matches SET season_id=$1, player1_id=$2, player2_id=$3, " +
      "player1_score=$4, player2_score=$5, winner_id=$6, played_at=$7 " +
      "WHERE id=$8 AND league_id=$9 RETURNING id",
      [updated.seasonId, updated.player1Id, updated.player2Id, updated.player1Score,
        updated.player2Score, deriveWinnerId(updated), updated.playedAt, id, req.league.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Match not found" });
    res.json(await readMatch(id, req.league.id));
  } catch (error) {
    console.error("Update match failed:", error.message);
    res.status(500).json({ error: "Could not update match" });
  }
});

router.delete("/:id", requireLeagueManager, async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid match id" });
  try {
    const result = await pool.query(
      "DELETE FROM matches WHERE id = $1 AND league_id = $2 RETURNING id",
      [id, req.league.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Match not found" });
    res.status(204).end();
  } catch (error) {
    console.error("Delete match failed:", error.message);
    res.status(500).json({ error: "Could not delete match" });
  }
});

export default router;
