import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateStreak,
  calculateLongestWinStreak,
  calculateWinPercentage,
} from "../src/utils/leagueStats.js";

test("calculateStreak returns null when there are no outcomes", () => {
  const result = calculateStreak([]);

  assert.equal(result, null);
});

test("calculateStreak returns type W and count 1 for one win", () => {
  const result = calculateStreak(["W"]);

  assert.deepEqual(result, {
    type: "W",
    count: 1,
  });
});

test("calculateStreak counts consecutive wins from the start", () => {
  const result = calculateStreak(["W", "W", "L"]);

  assert.deepEqual(result, {
    type: "W",
    count: 2,
  });
});

test("calculateStreak counts consecutive losses from the start", () => {
  const result = calculateStreak(["L", "L", "L", "W"]);

  assert.deepEqual(result, {
    type: "L",
    count: 3,
  });
});

test("calculateWinPercentage returns 0 when no matches were played", () => {
  const result = calculateWinPercentage(0, 0);

  assert.equal(result, 0);
});

test("calculateWinPercentage returns 33.33 for 1 win out of 3", () => {
  const result = calculateWinPercentage(1, 3);

  assert.equal(result, 33.33);
});

test("calculateWinPercentage returns 100 for 2 wins out of 2", () => {
  const result = calculateWinPercentage(2, 2);

  assert.equal(result, 100);
});

test("calculateLongestWinStreak returns null when there are no outcomes", () => {
  const result = calculateLongestWinStreak([]);

  assert.equal(result, null);
});

test("calculateLongestWinStreak returns 0 when all matches are losses", () => {
  const result = calculateLongestWinStreak(["L", "L", "L"]);

  assert.equal(result, 0);
});

test("calculateLongestWinStreak finds one long winning streak", () => {
  const result = calculateLongestWinStreak(["W", "W", "W", "L"]);

  assert.equal(result, 3);
});

test("calculateLongestWinStreak finds the longer of two streaks", () => {
  const result = calculateLongestWinStreak(["W", "W", "L", "W", "W", "W"]);

  assert.equal(result, 3);
});

test("calculateLongestWinStreak returns the full count when every match is a win", () => {
  const result = calculateLongestWinStreak(["W", "W", "W", "W"]);

  assert.equal(result, 4);
});
