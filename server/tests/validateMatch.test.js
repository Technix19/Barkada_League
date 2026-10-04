import test from "node:test";
import assert from "node:assert/strict";

import {
  checkBodyShape,
  validateCompleteMatch,
  deriveWinnerId,
} from "../src/utils/validateMatch.js";

const validMatch = {
  seasonId: 1,
  player1Id: 1,
  player2Id: 2,
  player1Score: 3,
  player2Score: 1,
  playedAt: "2026-10-04",
};

test("checkBodyShape rejects winnerId", () => {
  const result = checkBodyShape({ winnerId: 1 });

  assert.equal(
    result,
    "winnerId is derived from scores and must not be provided",
  );
});

test("checkBodyShape names unsupported fields", () => {
  const result = checkBodyShape({ foo: 1 });

  assert.equal(result, "Unsupported field(s): foo");
});

test("checkBodyShape rejects arrays", () => {
  const result = checkBodyShape([]);

  assert.equal(result, "Request body must be a JSON object");
});

test("validateCompleteMatch rejects the same player twice", () => {
  const match = {
    ...validMatch,
    player2Id: 1,
  };

  const result = validateCompleteMatch(match);

  assert.equal(result, "Players must be different");
});

test("validateCompleteMatch rejects tied scores", () => {
  const match = {
    ...validMatch,
    player1Score: 2,
    player2Score: 2,
  };

  const result = validateCompleteMatch(match);

  assert.equal(result, "Scores cannot be tied");
});

test("validateCompleteMatch rejects an invalid date", () => {
  const match = {
    ...validMatch,
    playedAt: "2026-02-30",
  };

  const result = validateCompleteMatch(match);

  assert.equal(result, "playedAt must be a valid date in YYYY-MM-DD format");
});

test("validateCompleteMatch returns null for a valid match", () => {
  const result = validateCompleteMatch(validMatch);

  assert.equal(result, null);
});

test("deriveWinnerId returns player1Id when player 1 has the higher score", () => {
  const result = deriveWinnerId(validMatch);

  assert.equal(result, 1);
});

test("deriveWinnerId returns player2Id when player 2 has the higher score", () => {
  const match = {
    ...validMatch,
    player1Score: 1,
    player2Score: 4,
  };

  const result = deriveWinnerId(match);

  assert.equal(result, 2);
});
