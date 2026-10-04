import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import { isValidDate } from "../utils/validateMatch.js";
import { seasonExists, getSeasonStandings } from "../utils/leagueStats.js";

const router = Router();

// Fields that are allowed when creating a player.
const PLAYER_FIELDS = ["name", "nickname", "joinDate"];

// Main player query used by the player routes.
// join_date is changed to text so it stays as YYYY-MM-DD.
const PLAYER_SELECT = `
  SELECT
    id,
    name,
    nickname,
    join_date::text AS "joinDate"
  FROM players
`;

// Checks if the player request body has the correct fields.
function checkPlayerBodyShape(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  const unsupportedFields = Object.keys(body).filter((field) => {
    return !PLAYER_FIELDS.includes(field);
  });

  if (unsupportedFields.length > 0) {
    return `Unsupported field(s): ${unsupportedFields.join(", ")}`;
  }

  return null;
}

// Get all players.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`${PLAYER_SELECT} ORDER BY name ASC`);

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/players failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new player.
router.post("/", async (req, res) => {
  const shapeError = checkPlayerBodyShape(req.body);

  if (shapeError) {
    return res.status(400).json({
      error: shapeError,
    });
  }

  // Name is required.
  if (!Object.prototype.hasOwnProperty.call(req.body, "name")) {
    return res.status(400).json({
      error: "name is required",
    });
  }

  // Name should be a real string and not just spaces.
  if (typeof req.body.name !== "string" || req.body.name.trim() === "") {
    return res.status(400).json({
      error: "name must be a non-empty string",
    });
  }

  const name = req.body.name.trim();

  if (name.length > 100) {
    return res.status(400).json({
      error: "name must be 100 characters or less",
    });
  }

  // Nickname is optional.
  // Empty nicknames will be saved as null.
  let nickname = null;

  if (req.body.nickname !== undefined && req.body.nickname !== null) {
    if (typeof req.body.nickname !== "string") {
      return res.status(400).json({
        error: "nickname must be a string or null",
      });
    }

    const trimmedNickname = req.body.nickname.trim();

    if (trimmedNickname.length > 100) {
      return res.status(400).json({
        error: "nickname must be 100 characters or less",
      });
    }

    if (trimmedNickname !== "") {
      nickname = trimmedNickname;
    }
  }

  const { joinDate } = req.body;

  // Join date is optional, but if it is sent it must be valid.
  if (joinDate !== undefined && !isValidDate(joinDate)) {
    return res.status(400).json({
      error: "joinDate must be a valid date in YYYY-MM-DD format",
    });
  }

  try {
    let inserted;

    // If no join date is provided, let the database use its default.
    if (joinDate === undefined) {
      inserted = await pool.query(
        `
          INSERT INTO players (name, nickname)
          VALUES ($1, $2)
          RETURNING id
        `,
        [name, nickname],
      );
    } else {
      inserted = await pool.query(
        `
          INSERT INTO players (name, nickname, join_date)
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [name, nickname, joinDate],
      );
    }

    const newPlayerId = inserted.rows[0].id;

    // Read the player again so the response is the same
    // format as GET /api/players/:id.
    const result = await pool.query(`${PLAYER_SELECT} WHERE id = $1`, [
      newPlayerId,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/players failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get one player using their id.
router.get("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid player id",
    });
  }

  try {
    const result = await pool.query(`${PLAYER_SELECT} WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Player not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/players/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a player's stats for one season.
router.get("/:id/stats", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid player id",
    });
  }

  const seasonId = parsePositiveInt(req.query.seasonId);

  if (seasonId === null) {
    return res.status(400).json({
      error: "seasonId is required and must be a positive integer",
    });
  }

  try {
    // Check if the season exists first.
    if (!(await seasonExists(seasonId))) {
      return res.status(404).json({
        error: "Season not found",
      });
    }

    const standings = await getSeasonStandings(seasonId);

    const entry = standings.find((row) => {
      return row.player.id === id;
    });

    if (!entry) {
      return res.status(404).json({
        error: "Player not found",
      });
    }

    res.json({
      player: entry.player,
      seasonId,
      rank: entry.rank,
      matchesPlayed: entry.matchesPlayed,
      wins: entry.wins,
      losses: entry.losses,
      winPercentage: entry.winPercentage,
      currentStreak: entry.currentStreak,
    });
  } catch (err) {
    console.error("GET /api/players/:id/stats failed:", err.message);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get all matches played by one player.
router.get("/:id/matches", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid player id",
    });
  }

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
    // Check if the player exists.
    const playerResult = await pool.query(
      "SELECT id FROM players WHERE id = $1",
      [id],
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        error: "Player not found",
      });
    }

    // Check the season if one was given.
    if (parsedSeasonId !== null) {
      const exists = await seasonExists(parsedSeasonId);

      if (!exists) {
        return res.status(404).json({
          error: "Season not found",
        });
      }
    }

    let query = `
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

      WHERE (m.player1_id = $1 OR m.player2_id = $1)
    `;

    const params = [id];

    // Add a season filter only when seasonId was provided.
    if (parsedSeasonId !== null) {
      query += " AND m.season_id = $2";
      params.push(parsedSeasonId);
    }

    query += " ORDER BY m.played_at DESC, m.id DESC";

    const result = await pool.query(query, params);

    const matches = result.rows.map((row) => {
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
    });

    res.json(matches);
  } catch (err) {
    console.error("GET /api/players/:id/matches failed:", err.message);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get matches played between two specific players.
router.get("/:id/vs/:opponentId", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const opponentId = parsePositiveInt(req.params.opponentId);

  if (id === null || opponentId === null) {
    return res.status(400).json({
      error: "Invalid player id",
    });
  }

  if (id === opponentId) {
    return res.status(400).json({
      error: "Players must be different",
    });
  }

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
    // Both players must exist.
    const playersResult = await pool.query(
      `
        SELECT id, name, nickname
        FROM players
        WHERE id = $1 OR id = $2
      `,
      [id, opponentId],
    );

    if (playersResult.rows.length !== 2) {
      return res.status(404).json({
        error: "Player not found",
      });
    }

    // Check the season if one was given.
    if (parsedSeasonId !== null) {
      const exists = await seasonExists(parsedSeasonId);

      if (!exists) {
        return res.status(404).json({
          error: "Season not found",
        });
      }
    }

    let query = `
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

      WHERE (
        (m.player1_id = $1 AND m.player2_id = $2)
        OR
        (m.player1_id = $2 AND m.player2_id = $1)
      )
    `;

    const params = [id, opponentId];

    // Add the season condition if needed.
    if (parsedSeasonId !== null) {
      query += " AND m.season_id = $3";
      params.push(parsedSeasonId);
    }

    query += " ORDER BY m.played_at DESC, m.id DESC";

    const result = await pool.query(query, params);

    let playerWins = 0;
    let opponentWins = 0;

    const matches = result.rows.map((row) => {
      // Count wins using winner_id.
      if (row.winnerId === id) {
        playerWins++;
      }

      if (row.winnerId === opponentId) {
        opponentWins++;
      }

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
    });

    const player = playersResult.rows.find((row) => {
      return row.id === id;
    });

    const opponent = playersResult.rows.find((row) => {
      return row.id === opponentId;
    });

    res.json({
      summary: {
        totalMatches: matches.length,

        player: {
          id: player.id,
          name: player.name,
          nickname: player.nickname,
          wins: playerWins,
        },

        opponent: {
          id: opponent.id,
          name: opponent.name,
          nickname: opponent.nickname,
          wins: opponentWins,
        },
      },

      matches,
    });
  } catch (err) {
    console.error("GET /api/players/:id/vs/:opponentId failed:", err.message);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
