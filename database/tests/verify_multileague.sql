-- Execute only against a fresh temporary PostgreSQL test database.
-- The foundation migration is run first, after the original schema and demo seed.
DO $test$
DECLARE
  demo_id int;
  private_a int;
  private_b int;
  season_a int;
  player_a1 int;
  player_a2 int;
  player_b1 int;
  test_match int;
BEGIN
  SELECT id INTO STRICT demo_id FROM leagues WHERE slug = 'barkada-demo';

  IF (SELECT count(*) FROM players WHERE league_id = demo_id) <> 6
     OR (SELECT count(*) FROM seasons WHERE league_id = demo_id) <> 1
     OR (SELECT count(*) FROM matches WHERE league_id = demo_id) <> 15 THEN
    RAISE EXCEPTION 'Legacy data not preserved correctly';
  END IF;
  IF (SELECT owner_id IS NOT NULL FROM leagues WHERE id = demo_id) THEN
    RAISE EXCEPTION 'Demo must be unowned';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('players','seasons','matches','profiles','leagues','league_members')
      AND c.relkind = 'r' AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'At least one exposed table has RLS disabled';
  END IF;
  IF has_table_privilege('anon', 'public.players', 'SELECT')
     OR has_table_privilege('authenticated', 'public.matches', 'INSERT')
     OR has_table_privilege('anon', 'public.leagues', 'SELECT') THEN
    RAISE EXCEPTION 'PostgREST roles can bypass Express authorization';
  END IF;

  INSERT INTO auth.users(id) VALUES
     ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
     ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  INSERT INTO leagues(name, slug, owner_id, is_public)
  VALUES ('Private A', 'private-a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false)
  RETURNING id INTO private_a;
  INSERT INTO leagues(name, slug, owner_id, is_public)
  VALUES ('Private B', 'private-b', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', false)
  RETURNING id INTO private_b;

  INSERT INTO league_members(league_id, user_id, role) VALUES
     (private_a, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner'),
     (private_b, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'owner');
  INSERT INTO seasons(league_id, name, start_date, is_active)
  VALUES (private_a,'A 2026','2026-11-04',true) RETURNING id INTO season_a;
  INSERT INTO players(league_id, name) VALUES (private_a,'Player A1') RETURNING id INTO player_a1;
  INSERT INTO players(league_id, name) VALUES (private_a,'Player A2') RETURNING id INTO player_a2;
  INSERT INTO players(league_id, name) VALUES (private_b,'Player B1') RETURNING id INTO player_b1;

  INSERT INTO matches(league_id,season_id,player1_id,player2_id,
                      player1_score,player2_score,winner_id,played_at)
  VALUES (private_a,season_a,player_a1,player_a2,21,15,player_a1,current_date)
  RETURNING id INTO test_match;
  IF NOT EXISTS (SELECT 1 FROM matches WHERE id=test_match AND league_id=private_a) THEN
    RAISE EXCEPTION 'Valid league-scoped match not inserted';
  END IF;

  BEGIN
    INSERT INTO matches(league_id,season_id,player1_id,player2_id,
                        player1_score,player2_score,winner_id,played_at)
    VALUES (private_a,season_a,player_a1,player_b1,21,15,player_a1,current_date);
    RAISE EXCEPTION 'Cross-league player was incorrectly accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO seasons(league_id, name, start_date, is_active)
    VALUES (private_a,'Duplicate active season',current_date,true);
    RAISE EXCEPTION 'Multiple active seasons incorrectly allowed';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  IF (SELECT count(*) FROM players WHERE league_id=private_a) <> 2
     OR (SELECT count(*) FROM players WHERE league_id=private_b) <> 1 THEN
    RAISE EXCEPTION 'Player records crossed leagues';
  END IF;
  RAISE NOTICE 'PASS: legacy data, RLS, PostgREST roles, cross-league foreign keys and active-season constraint';
END $test$;
