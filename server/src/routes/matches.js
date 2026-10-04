import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";

import {
  MATCH_FIELDS,
  checkBodyShape,
  validateCompleteMatch,
  deriveWinnerId,
} from "../utils/validateMatch.js";

const router = Router();

// Main query used when getting match data.
// The player and winner details are joined here so we can return complete match objects.
const MATCH_SELECT = `
  SELECT
    m.id,
    m.season_id AS "seasonId",
    m.player1_score AS "player1Score",
    m.player2_score AS "player2Score",
    m.played_at::text AS "playedAt",
    m.created_at AS "createdAt",

    p1.id AS "player1Id",
    p1.name AS "player1Name",
    p1.nickname AS "player1Nickname",

    p2.id AS "player2Id",
    p2.name AS "player2Name",
    p2.nickname AS "player2Nickname",

    w.id AS "winnerId",
    w.name AS "winnerName",
    w.nickname AS "winnerNickname"

  FROM matches m
  JOIN players p1 ON p1.id = m.player1_id
  JOIN players p2 ON p2.id = m.player2_id
  JOIN players w ON w.id = m.winner_id
`;

// Changes the database row into the format used by the API.
function mapMatchRow(row) {
  return {
    id: row.id,
    seasonId: row.seasonId,

    player1: {
      id: row.player1Id,
      name: row.player1Name,
      nickname: row.player1Nickname,
    },

    player2: {
      id: row.player2Id,
      name: row.player2Name,
      nickname: row.player2Nickname,
    },

    player1Score: row.player1Score,
    player2Score: row.player2Score,

    winner: {
      id: row.winnerId,
      name: row.winnerName,
      nickname: row.winnerNickname,
    },

    playedAt: row.playedAt,
    createdAt: row.createdAt,
  };
}

// GET all matches.
// seasonId is optional, so it can return all matches or matches from one season.
router.get("/", async (req, res) => {
  const { seasonId } = req.query;
  let parsedSeasonId = null;

  if (seasonId !== undefined) {
    parsedSeasonId = parsePositiveInt(seasonId);

    if (parsedSeasonId === null) {
      return res.status(400).json({
        error: "Invalid seasonId",
      });
    }
  }

  try {
    let query = MATCH_SELECT;
    const params = [];

    // Only add the season filter if one was provided.
    if (parsedSeasonId !== null) {
      query += " WHERE m.season_id = $1";
      params.push(parsedSeasonId);
    }

    query += " ORDER BY m.played_at DESC, m.id DESC";

    const result = await pool.query(query, params);

    const matches = result.rows.map((row) => {
      return mapMatchRow(row);
    });

    res.json(matches);
  } catch (err) {
    console.error("GET /api/matches failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET one match using its id.
router.get("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid match id",
    });
  }

  try {
    const result = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    const match = mapMatchRow(result.rows[0]);

    res.json(match);
  } catch (err) {
    console.error("GET /api/matches/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Checks if the season and both players actually exist.
async function findMissingReference({ seasonId, player1Id, player2Id }) {
  const seasonResult = await pool.query("SELECT 1 FROM seasons WHERE id = $1", [
    seasonId,
  ]);

  if (seasonResult.rows.length === 0) {
    return "Season does not exist";
  }

  const player1Result = await pool.query(
    "SELECT 1 FROM players WHERE id = $1",
    [player1Id],
  );

  if (player1Result.rows.length === 0) {
    return "Player 1 does not exist";
  }

  const player2Result = await pool.query(
    "SELECT 1 FROM players WHERE id = $1",
    [player2Id],
  );

  if (player2Result.rows.length === 0) {
    return "Player 2 does not exist";
  }

  return null;
}

// POST creates a new match.
router.post("/", async (req, res) => {
  // First check if the request body has valid fields.
  const shapeError = checkBodyShape(req.body);

  if (shapeError) {
    return res.status(400).json({
      error: shapeError,
    });
  }

  // Only copy the fields that are allowed for a match.
  const match = {
    seasonId: req.body.seasonId,
    player1Id: req.body.player1Id,
    player2Id: req.body.player2Id,
    player1Score: req.body.player1Score,
    player2Score: req.body.player2Score,
    playedAt: req.body.playedAt,
  };

  // Check the values inside the match.
  const validationError = validateCompleteMatch(match);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  try {
    // Make sure the season and players exist before inserting.
    const missingRefError = await findMissingReference(match);

    if (missingRefError) {
      return res.status(400).json({
        error: missingRefError,
      });
    }

    // The winner is calculated using the scores.
    const winnerId = deriveWinnerId(match);

    const inserted = await pool.query(
      `
        INSERT INTO matches
          (
            season_id,
            player1_id,
            player2_id,
            player1_score,
            player2_score,
            winner_id,
            played_at
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        match.seasonId,
        match.player1Id,
        match.player2Id,
        match.player1Score,
        match.player2Score,
        winnerId,
        match.playedAt,
      ],
    );

    // Get the full match after inserting it.
    const result = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [
      inserted.rows[0].id,
    ]);

    const newMatch = mapMatchRow(result.rows[0]);

    res.status(201).json(newMatch);
  } catch (err) {
    console.error("POST /api/matches failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update an existing match.
router.patch("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "Invalid match id" });
  }

  // Check if the request body has valid fields.
  const shapeError = checkBodyShape(req.body);

  if (shapeError) {
    return res.status(400).json({ error: shapeError });
  }

  // Find which match fields were actually sent by the user.
  const providedFields = MATCH_FIELDS.filter((field) => {
    return Object.prototype.hasOwnProperty.call(req.body, field);
  });

  if (providedFields.length === 0) {
    return res.status(400).json({
      error: "No updatable fields provided",
    });
  }

  try {
    // Check if the match exists first.
    const existingResult = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [
      id,
    ]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    const existing = existingResult.rows[0];

    // Start with the current match data.
    const updatedMatch = {
      seasonId: existing.seasonId,
      player1Id: existing.player1Id,
      player2Id: existing.player2Id,
      player1Score: existing.player1Score,
      player2Score: existing.player2Score,
      playedAt: existing.playedAt,
    };

    // Replace only the fields that were provided.
    for (const field of providedFields) {
      updatedMatch[field] = req.body[field];
    }

    // Validate the complete updated match.
    const validationError = validateCompleteMatch(updatedMatch);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    // Make sure the season and players still exist.
    const missingRefError = await findMissingReference(updatedMatch);

    if (missingRefError) {
      return res.status(400).json({
        error: missingRefError,
      });
    }

    // Recalculate the winner in case the scores changed.
    const winnerId = deriveWinnerId(updatedMatch);

    await pool.query(
      `
        UPDATE matches
        SET
          season_id = $1,
          player1_id = $2,
          player2_id = $3,
          player1_score = $4,
          player2_score = $5,
          winner_id = $6,
          played_at = $7
        WHERE id = $8
      `,
      [
        updatedMatch.seasonId,
        updatedMatch.player1Id,
        updatedMatch.player2Id,
        updatedMatch.player1Score,
        updatedMatch.player2Score,
        winnerId,
        updatedMatch.playedAt,
        id,
      ],
    );

    // Get the updated match and return it.
    const result = await pool.query(`${MATCH_SELECT} WHERE m.id = $1`, [id]);

    const match = mapMatchRow(result.rows[0]);

    res.json(match);
  } catch (err) {
    console.error("PATCH /api/matches/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a match using its id.
router.delete("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid match id",
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM matches WHERE id = $1 RETURNING id",
      [id],
    );

    // If nothing was deleted, the match does not exist.
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    // 204 means the delete worked and there is no response body.
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /api/matches/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
