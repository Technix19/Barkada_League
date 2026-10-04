import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        name,
        start_date::text AS "startDate",
        end_date::text AS "endDate",
        is_active AS "isActive"
      FROM seasons
      ORDER BY is_active DESC, start_date DESC
    `;

    const result = await pool.query(sql);

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/seasons failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/active", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        name,
        start_date::text AS "startDate",
        end_date::text AS "endDate",
        is_active as "isActive"
      FROM seasons
      WHERE is_active = true
      LIMIT 1
    `;

    const result = await pool.query(sql);

    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]);
    }

    res.status(404).json({ error: "No active season" });
  } catch (err) {
    console.error("GET /api/seasons/active failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
