import pool from "../db.js";
import { parsePositiveInt } from "../utils/validation.js";

export function canManageLeague(role) {
  return role === "owner" || role === "admin";
}

// Must follow optionalAuth. req.user comes only from a verified Supabase token.
export async function loadLeagueAccess(req, res, next) {
  const leagueId = parsePositiveInt(req.params.leagueId);
  if (leagueId === null) return res.status(400).json({ error: "Invalid league id" });

  try {
    const result = await pool.query(
      "SELECT id, name, slug, is_public AS \"isPublic\", owner_id AS \"ownerId\" FROM leagues WHERE id = $1",
      [leagueId],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "League not found" });

    const league = result.rows[0];
    let role = null;
    if (req.user) {
      const membership = await pool.query(
        "SELECT role FROM league_members WHERE league_id = $1 AND user_id = $2",
        [leagueId, req.user.id],
      );
      role = membership.rows[0]?.role ?? null;
      if (league.ownerId === req.user.id) role = "owner";
    }

    // Private leagues must not be readable by outsiders, including guessed IDs.
    if (!league.isPublic && !role) {
      return res.status(404).json({ error: "League not found" });
    }

    req.league = league;
    req.leagueRole = role;
    return next();
  } catch (error) {
    console.error("League access failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Call on each mutation; checking in the UI alone is never sufficient.
export function requireLeagueManager(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  if (!canManageLeague(req.leagueRole)) {
    return res.status(403).json({ error: "League administrator permission required" });
  }
  return next();
}
