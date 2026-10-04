import pool from "../db.js";

// Gets the stats of every player for one season.
// LEFT JOIN is used so players with no matches still show up.
const PLAYER_SEASON_STATS = `
  SELECT
    p.id,
    p.name,
    p.nickname,
    COUNT(m.id)::int AS "matchesPlayed",
    COUNT(m.id) FILTER (WHERE m.winner_id = p.id)::int AS wins
  FROM players p
  LEFT JOIN matches m
    ON (m.player1_id = p.id OR m.player2_id = p.id)
    AND m.season_id = $1
  GROUP BY p.id, p.name, p.nickname
`;

// Gets all matches from the season, newest first.
// This is used for calculating each player's current streak.
const SEASON_MATCH_OUTCOMES = `
  SELECT
    id,
    player1_id AS "player1Id",
    player2_id AS "player2Id",
    winner_id AS "winnerId"
  FROM matches
  WHERE season_id = $1
  ORDER BY played_at DESC, id DESC
`;

// Makes a list of wins and losses for each player.
function buildOutcomesByPlayer(matches) {
  const outcomesByPlayer = new Map();

  for (const match of matches) {
    const playerIds = [match.player1Id, match.player2Id];

    for (const playerId of playerIds) {
      if (!outcomesByPlayer.has(playerId)) {
        outcomesByPlayer.set(playerId, []);
      }

      // Add W if the player won, otherwise add L.
      if (match.winnerId === playerId) {
        outcomesByPlayer.get(playerId).push("W");
      } else {
        outcomesByPlayer.get(playerId).push("L");
      }
    }
  }

  return outcomesByPlayer;
}

// Calculates the current win or loss streak.
export function calculateStreak(outcomesNewestFirst) {
  if (!outcomesNewestFirst || outcomesNewestFirst.length === 0) {
    return null;
  }

  const type = outcomesNewestFirst[0];
  let count = 0;

  for (const outcome of outcomesNewestFirst) {
    if (outcome !== type) {
      break;
    }

    count++;
  }

  return {
    type,
    count,
  };
}

// Calculates the player's win percentage.
export function calculateWinPercentage(wins, matchesPlayed) {
  if (matchesPlayed === 0) {
    return 0;
  }

  return Math.round((wins / matchesPlayed) * 10000) / 100;
}

// Checks if the season exists in the database.
export async function seasonExists(seasonId) {
  const result = await pool.query("SELECT 1 FROM seasons WHERE id = $1", [
    seasonId,
  ]);

  return result.rows.length > 0;
}

// Gets all player stats for a season and ranks them.
export async function getSeasonStandings(seasonId) {
  // Run both queries at the same time.
  const [statsResult, matchesResult] = await Promise.all([
    pool.query(PLAYER_SEASON_STATS, [seasonId]),
    pool.query(SEASON_MATCH_OUTCOMES, [seasonId]),
  ]);

  const outcomesByPlayer = buildOutcomesByPlayer(matchesResult.rows);

  // Build the stats for every player.
  const standings = statsResult.rows.map((row) => {
    const matchesPlayed = row.matchesPlayed;
    const wins = row.wins;

    return {
      player: {
        id: row.id,
        name: row.name,
        nickname: row.nickname,
      },
      matchesPlayed,
      wins,
      losses: matchesPlayed - wins,
      winPercentage: calculateWinPercentage(wins, matchesPlayed),
      currentStreak: calculateStreak(outcomesByPlayer.get(row.id)),
    };
  });

  // Sort the players for the leaderboard.
  standings.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (b.winPercentage !== a.winPercentage) {
      return b.winPercentage - a.winPercentage;
    }

    if (b.matchesPlayed !== a.matchesPlayed) {
      return b.matchesPlayed - a.matchesPlayed;
    }

    return a.player.name.localeCompare(b.player.name);
  });

  // Add the rank after sorting.
  return standings.map((entry, index) => {
    return {
      rank: index + 1,
      ...entry,
    };
  });
}
