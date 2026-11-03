import { Router } from "express";
import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";
import { getSeasonStandings } from "../utils/leagueStats.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const seasonId = parsePositiveInt(req.query.seasonId);
  if (!seasonId) return res.status(400).json({ error: "Valid seasonId required" });
  try {
    const season = await pool.query(
      "SELECT id FROM seasons WHERE id = $1 AND league_id = $2",
      [seasonId, req.league.id],
    );
    if (!season.rowCount) return res.status(404).json({ error: "Season not found" });
    res.json(await getSeasonStandings(seasonId, req.league.id));
  } catch (error) {
    console.error("Leaderboard failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
