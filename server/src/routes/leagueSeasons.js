import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import { isValidDate } from "../utils/validateMatch.js";
import { requireLeagueManager } from "../middleware/leagueAccess.js";

const router = Router({ mergeParams: true });
const SELECT = "SELECT id, name, start_date::text AS \"startDate\", " +
  "end_date::text AS \"endDate\", is_active AS \"isActive\" FROM seasons";

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      SELECT + " WHERE league_id = $1 ORDER BY is_active DESC, start_date DESC",
      [req.league.id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("List seasons failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/active", async (req, res) => {
  try {
    const result = await pool.query(
      SELECT + " WHERE league_id = $1 AND is_active = TRUE LIMIT 1",
      [req.league.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "No active season" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Active season failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireLeagueManager, async (req, res) => {
  const { name, startDate, endDate = null, isActive = true } = req.body ?? {};
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
      Object.keys(req.body).some((key) => !["name", "startDate", "endDate", "isActive"].includes(key)) ||
      typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
      !isValidDate(startDate) || (endDate !== null && !isValidDate(endDate)) ||
      (endDate !== null && endDate < startDate) || typeof isActive !== "boolean") {
    return res.status(400).json({ error: "Invalid season details" });
  }
  const client = await pool.connect().catch(() => null);
  if (!client) return res.status(503).json({ error: "Database unavailable" });
  try {
    await client.query("BEGIN");
    // Lock the parent row so concurrent changes cannot create two active seasons.
    await client.query("SELECT id FROM leagues WHERE id = $1 FOR UPDATE", [req.league.id]);
    if (isActive) {
      await client.query("UPDATE seasons SET is_active = FALSE WHERE league_id = $1", [req.league.id]);
    }
    const created = await client.query(
      "INSERT INTO seasons (league_id, name, start_date, end_date, is_active) " +
      "VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [req.league.id, name.trim(), startDate, endDate, isActive],
    );
    const result = await client.query(
      SELECT + " WHERE id = $1 AND league_id = $2",
      [created.rows[0].id, req.league.id],
    );
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create season failed:", error.message);
    res.status(500).json({ error: "Could not create season" });
  } finally {
    client.release();
  }
});

router.patch("/:id/activate", requireLeagueManager, async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid season id" });

  const client = await pool.connect().catch(() => null);
  if (!client) return res.status(503).json({ error: "Database unavailable" });
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM leagues WHERE id = $1 FOR UPDATE", [req.league.id]);
    const exists = await client.query(
      "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
      [id, req.league.id],
    );
    if (!exists.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Season not found" });
    }
    await client.query("UPDATE seasons SET is_active = FALSE WHERE league_id = $1", [req.league.id]);
    await client.query(
      "UPDATE seasons SET is_active = TRUE WHERE id = $1 AND league_id = $2",
      [id, req.league.id],
    );
    await client.query("COMMIT");
    res.json({ id, isActive: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Activate season failed:", error.message);
    res.status(500).json({ error: "Could not activate season" });
  } finally {
    client.release();
  }
});

export default router;
