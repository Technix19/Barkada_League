import { Router } from "express";
import { randomBytes } from "node:crypto";
import pool from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { loadLeagueAccess } from "../middleware/leagueAccess.js";
import playersRouter from "./leaguePlayers.js";
import seasonsRouter from "./leagueSeasons.js";
import matchesRouter from "./leagueMatches.js";
import leaderboardRouter from "./leagueLeaderboard.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT l.id, l.name, l.slug, l.is_public AS \"isPublic\", lm.role " +
      "FROM leagues l JOIN league_members lm ON lm.league_id = l.id " +
      "WHERE lm.user_id = $1 ORDER BY l.created_at DESC, l.id DESC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("List leagues failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
      Object.keys(req.body).some((key) => !["name", "isPublic"].includes(key))) {
    return res.status(400).json({ error: "Expected name and optional isPublic" });
  }
  const name = req.body.name;
  const isPublic = req.body.isPublic ?? false;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
      typeof isPublic !== "boolean") {
    return res.status(400).json({ error: "Invalid league name or visibility" });
  }

  // Slug is generated server-side; no one can claim another league's slug.
  const stem = name.trim().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 65) || "league";
  const slug = stem + "-" + randomBytes(6).toString("hex");

  const client = await pool.connect().catch(() => null);
  if (!client) return res.status(503).json({ error: "Database unavailable" });
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO leagues (name, slug, owner_id, is_public) VALUES ($1, $2, $3, $4) " +
      "RETURNING id, name, slug, is_public AS \"isPublic\"",
      [name.trim(), slug, req.user.id, isPublic],
    );
    const league = result.rows[0];
    await client.query(
      "INSERT INTO league_members (league_id, user_id, role) VALUES ($1, $2, 'owner')",
      [league.id, req.user.id],
    );
    await client.query("COMMIT");
    res.status(201).json({ ...league, role: "owner" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create league failed:", error.message);
    res.status(500).json({ error: "Could not create league" });
  } finally {
    client.release();
  }
});

// Authorize once, before any league-scoped resource handler.
router.use("/:leagueId", optionalAuth, loadLeagueAccess);

router.get("/:leagueId", (req, res) => {
  const { id, name, slug, isPublic } = req.league;
  res.json({ id, name, slug, isPublic, role: req.leagueRole });
});
router.use("/:leagueId/players", playersRouter);
router.use("/:leagueId/seasons", seasonsRouter);
router.use("/:leagueId/matches", matchesRouter);
router.use("/:leagueId/leaderboard", leaderboardRouter);

export default router;
