import express from "express";
import cors from "cors";
import pool from "./db.js";
import leaguesRouter from "./routes/leagues.js";
import { rateLimit } from "./utils/rateLimit.js";

const app = express();

// FRONTEND_ORIGIN is a comma-separated allowlist. No Origin is allowed for
// server-to-server requests; CORS is not an authorization mechanism.
const origins = new Set(
  (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.has(origin)) return callback(null, true);
    const error = new Error("Origin not allowed");
    error.status = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/leagues", leaguesRouter);

// The old global API has no user/league boundary. It MUST NOT remain writable
// or enumerate all leagues after accounts are enabled. A later frontend phase
// will switch every caller to /api/leagues/:leagueId/* before deploying this.
app.use(
  ["/api/players", "/api/seasons", "/api/matches", "/api/leaderboard"],
  (req, res) => res.status(410).json({
    error: "Legacy API retired. Use /api/leagues/:leagueId/...",
  }),
);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status === 403 ? 403 : 500).json({
    error: error.status === 403 ? "Origin not allowed" : "Internal server error",
  });
});

export default app;
