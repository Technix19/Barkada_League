-- Barkada League: multi-league foundation (one-time, additive migration).
-- IMPORTANT: Back up the existing Supabase database before running.
-- Run after database/schema.sql on a fresh database, or on the existing DB.
-- This migration preserves every existing player, season and match.
-- Do not run database/seed.sql against a populated database.
BEGIN;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL CHECK (btrim(name) <> ''),
  slug VARCHAR(120) NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE league_members (
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX idx_league_members_user ON league_members(user_id);

-- The legacy six-player league becomes a public, read-only demo.
-- It has no user owner until an intentional ownership transfer is implemented.
INSERT INTO leagues (name, slug, is_public)
VALUES ('Barkada Demo', 'barkada-demo', TRUE);

ALTER TABLE players
  ADD COLUMN league_id INTEGER REFERENCES leagues(id),
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE seasons
  ADD COLUMN league_id INTEGER REFERENCES leagues(id);

ALTER TABLE matches
  ADD COLUMN league_id INTEGER REFERENCES leagues(id);

UPDATE players
SET league_id = (SELECT id FROM leagues WHERE slug = 'barkada-demo')
WHERE league_id IS NULL;

UPDATE seasons
SET league_id = (SELECT id FROM leagues WHERE slug = 'barkada-demo')
WHERE league_id IS NULL;

UPDATE matches
SET league_id = (SELECT id FROM leagues WHERE slug = 'barkada-demo')
WHERE league_id IS NULL;

ALTER TABLE players ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE seasons ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN league_id SET NOT NULL;

-- Composite FKs ensure season, winner and both players always share a league.
-- The normal id primary keys remain unchanged for existing records and URLs.
ALTER TABLE players ADD CONSTRAINT players_id_league_unique UNIQUE (id, league_id);
ALTER TABLE seasons ADD CONSTRAINT seasons_id_league_unique UNIQUE (id, league_id);
ALTER TABLE matches
  ADD CONSTRAINT matches_season_league_fk
  FOREIGN KEY (season_id, league_id) REFERENCES seasons(id, league_id),
  ADD CONSTRAINT matches_player1_league_fk
  FOREIGN KEY (player1_id, league_id) REFERENCES players(id, league_id),
  ADD CONSTRAINT matches_player2_league_fk
  FOREIGN KEY (player2_id, league_id) REFERENCES players(id, league_id),
  ADD CONSTRAINT matches_winner_league_fk
  FOREIGN KEY (winner_id, league_id) REFERENCES players(id, league_id),
  ADD CONSTRAINT matches_winner_matches_scores CHECK (
    (player1_score > player2_score AND winner_id = player1_id)
    OR (player2_score > player1_score AND winner_id = player2_id)
  );

CREATE UNIQUE INDEX idx_one_active_season_per_league
  ON seasons (league_id) WHERE is_active = TRUE;
CREATE INDEX idx_players_league ON players (league_id);
CREATE INDEX idx_players_user ON players (user_id);
CREATE INDEX idx_seasons_league ON seasons (league_id);
CREATE INDEX idx_matches_league_date ON matches (league_id, played_at DESC);

-- Database access is exclusively through Express + server-side authorization.
-- Supabase PostgREST anon/authenticated clients must NOT bypass the API.
-- The privileged PostgreSQL connection used by Express is unaffected.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profiles, leagues, league_members, players, seasons, matches
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE players_id_seq, seasons_id_seq, matches_id_seq, leagues_id_seq
  FROM PUBLIC, anon, authenticated;

COMMIT;
