-- Barkada League database schema
-- Run this against the Supabase PostgreSQL database (Supabase SQL Editor
-- or any PostgreSQL client) before running seed.sql.

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,

  season_id INTEGER NOT NULL
    REFERENCES seasons(id)
    ON DELETE RESTRICT,

  player1_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  player2_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  player1_score INTEGER NOT NULL
    CHECK (player1_score >= 0),

  player2_score INTEGER NOT NULL
    CHECK (player2_score >= 0),

  winner_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  played_at DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (player1_id <> player2_id),
  CHECK (player1_score <> player2_score),
  CHECK (
    winner_id = player1_id
    OR winner_id = player2_id
  )
);

CREATE INDEX IF NOT EXISTS idx_matches_season_id
ON matches(season_id);

CREATE INDEX IF NOT EXISTS idx_matches_played_at
ON matches(played_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_player1_id
ON matches(player1_id);

CREATE INDEX IF NOT EXISTS idx_matches_player2_id
ON matches(player2_id);
