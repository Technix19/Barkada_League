import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        start_date::text AS "startDate",
        end_date::text AS "endDate",
        is_active AS "isActive"
      FROM seasons
      ORDER BY is_active DESC, start_date DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /api/seasons failed:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
