-- Barkada League seed data
-- Run this after schema.sql, against a fresh/empty database, so that the
-- SERIAL primary keys below line up with the ids referenced by the match
-- rows (players 1-6, season 1).

INSERT INTO players (name, nickname, join_date) VALUES
  ('Lance', 'Lan', '2026-07-01'),  -- id 1
  ('Josh',  NULL,  '2026-07-01'),  -- id 2
  ('Mark',  NULL,  '2026-07-05'),  -- id 3
  ('Alex',  NULL,  '2026-07-05'),  -- id 4
  ('Nico',  NULL,  '2026-07-10'),  -- id 5
  ('Paolo', NULL,  '2026-07-10');  -- id 6

INSERT INTO seasons (name, start_date, end_date, is_active) VALUES
  ('Season 1', '2026-08-01', NULL, TRUE);  -- id 1

-- Matches, oldest to newest. Winner ids match the higher score in every row.
-- Resulting current streaks (newest match first per player):
--   Lance: W6   Josh: W1   Mark: L2   Alex: L1   Nico: L4   Paolo: W1
INSERT INTO matches
  (season_id, player1_id, player2_id, player1_score, player2_score, winner_id, played_at)
VALUES
  (1, 1, 2, 21, 15, 1, '2026-08-01'), -- Lance beats Josh
  (1, 3, 4, 21, 18, 3, '2026-08-02'), -- Mark beats Alex
  (1, 5, 6, 21, 19, 5, '2026-08-03'), -- Nico beats Paolo
  (1, 1, 3, 21, 14, 1, '2026-08-05'), -- Lance beats Mark
  (1, 2, 4, 21, 17, 2, '2026-08-06'), -- Josh beats Alex
  (1, 5, 1, 18, 21, 1, '2026-08-08'), -- Lance beats Nico
  (1, 6, 2, 21, 16, 6, '2026-08-09'), -- Paolo beats Josh
  (1, 3, 5, 21, 20, 3, '2026-08-10'), -- Mark beats Nico
  (1, 4, 6, 21, 13, 4, '2026-08-12'), -- Alex beats Paolo
  (1, 1, 2, 21, 19, 1, '2026-08-13'), -- Lance beats Josh
  (1, 3, 1, 17, 21, 1, '2026-08-15'), -- Lance beats Mark
  (1, 4, 5, 21, 15, 4, '2026-08-16'), -- Alex beats Nico
  (1, 2, 3, 21, 18, 2, '2026-08-18'), -- Josh beats Mark
  (1, 1, 4, 21, 16, 1, '2026-08-19'), -- Lance beats Alex
  (1, 6, 5, 21, 17, 6, '2026-08-20'); -- Paolo beats Nico
