import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import { seasonExists, getSeasonStandings } from "../utils/leagueStats.js";

const router = Router();

// join_date is cast to text so the pg driver returns a plain "YYYY-MM-DD"
// string instead of a JS Date object -- letting it parse as a Date risks a
// timezone-driven off-by-one-day shift when it is later serialized.
const PLAYER_SELECT = `
  SELECT
    id,
    name,
    nickname,
    join_date::text AS "joinDate"
  FROM players
`;

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`${PLAYER_SELECT} ORDER BY name ASC`);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/players failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid player id" });
  }

  try {
    const { rows } = await pool.query(`${PLAYER_SELECT} WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/players/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Derived per-player season statistics, reusing the exact same computation
// as GET /api/leaderboard (see utils/leagueStats.js) so the two endpoints
// can never disagree. A player who exists but has no matches this season
// still returns 200 with zeroed stats -- only a genuinely unknown player
// id or season id is a 404.
router.get("/:id/stats", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid player id" });
  }

  const seasonId = parsePositiveInt(req.query.seasonId);
  if (seasonId === null) {
    return res
      .status(400)
      .json({ error: "seasonId is required and must be a positive integer" });
  }

  try {
    if (!(await seasonExists(seasonId))) {
      return res.status(404).json({ error: "Season not found" });
    }

    const standings = await getSeasonStandings(seasonId);
    const entry = standings.find((row) => row.player.id === id);
    if (!entry) {
      return res.status(404).json({ error: "Player not found" });
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
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/matches", async (req, res) => {
  const id = parsePositiveInt(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: "Invalid player id" });
  }

  const { seasonId } = req.query;
  let parsedSeasonId = null;

  if (seasonId !== undefined) {
    parsedSeasonId = parsePositiveInt(seasonId);

    if (parsedSeasonId === null) {
      return res.status(400).json({ error: "Invalid seasonId" });
    }
  }

  try {
    // Check if the player exists
    const playerResult = await pool.query(
      "SELECT id FROM players WHERE id = $1",
      [id],
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }

    // If a season was given, check if it exists
    if (parsedSeasonId !== null) {
      const exists = await seasonExists(parsedSeasonId);

      if (!exists) {
        return res.status(404).json({ error: "Season not found" });
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

    // Add the season filter only if one was provided
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
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/vs/:opponentId", async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const opponentId = parsePositiveInt(req.params.opponentId);

  if (id === null || opponentId === null) {
    return res.status(400).json({ error: "Invalid player id" });
  }

  if (id === opponentId) {
    return res.status(400).json({ error: "Players must be different" });
  }

  const { seasonId } = req.query;
  let parsedSeasonId = null;

  if (seasonId !== undefined) {
    parsedSeasonId = parsePositiveInt(seasonId);

    if (parsedSeasonId === null) {
      return res.status(400).json({ error: "Invalid seasonId" });
    }
  }

  try {
    // Check if both players exist
    const playersResult = await pool.query(
      `SELECT id, name, nickname
       FROM players
       WHERE id = $1 OR id = $2`,
      [id, opponentId],
    );

    if (playersResult.rows.length !== 2) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Check if the season exists if one was provided
    if (parsedSeasonId !== null) {
      const exists = await seasonExists(parsedSeasonId);

      if (!exists) {
        return res.status(404).json({ error: "Season not found" });
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

    if (parsedSeasonId !== null) {
      query += " AND m.season_id = $3";
      params.push(parsedSeasonId);
    }

    query += " ORDER BY m.played_at DESC, m.id DESC";

    const result = await pool.query(query, params);

    let playerWins = 0;
    let opponentWins = 0;

    const matches = result.rows.map((row) => {
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

    const player = playersResult.rows.find((row) => row.id === id);
    const opponent = playersResult.rows.find((row) => row.id === opponentId);

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

    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
