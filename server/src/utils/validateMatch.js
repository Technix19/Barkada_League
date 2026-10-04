// Shared match validation for POST /api/matches and PATCH /api/matches/:id.
// The server is the sole authority on winnerId -- callers derive it with
// deriveWinnerId() after validation passes; it is never accepted from the
// client (see checkBodyShape).
export const MATCH_FIELDS = [
  "seasonId",
  "player1Id",
  "player2Id",
  "player1Score",
  "player2Score",
  "playedAt",
];

function isPlainObject(value) {
  if (value === null) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isValidDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  // Make sure the format is YYYY-MM-DD
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  // Convert it to a real date
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  // Check if JavaScript changed an impossible date like 2026-02-30
  const formattedDate = date.toISOString().slice(0, 10);

  return formattedDate === value;
}

export function checkBodyShape(body) {
  if (!isPlainObject(body)) {
    return "Request body must be a JSON object";
  }

  if (Object.prototype.hasOwnProperty.call(body, "winnerId")) {
    return "winnerId is derived from scores and must not be provided";
  }

  const unsupportedFields = Object.keys(body).filter((key) => {
    return !MATCH_FIELDS.includes(key);
  });

  if (unsupportedFields.length > 0) {
    return `Unsupported field(s): ${unsupportedFields.join(", ")}`;
  }

  return null;
}

export function validateCompleteMatch(match) {
  if (!isPositiveInteger(match.seasonId)) {
    return "seasonId must be a positive integer";
  }

  if (!isPositiveInteger(match.player1Id)) {
    return "player1Id must be a positive integer";
  }

  if (!isPositiveInteger(match.player2Id)) {
    return "player2Id must be a positive integer";
  }

  if (match.player1Id === match.player2Id) {
    return "Players must be different";
  }

  if (!isNonNegativeInteger(match.player1Score)) {
    return "player1Score must be a non-negative integer";
  }

  if (!isNonNegativeInteger(match.player2Score)) {
    return "player2Score must be a non-negative integer";
  }

  if (match.player1Score === match.player2Score) {
    return "Scores cannot be tied";
  }

  if (!isValidDate(match.playedAt)) {
    return "playedAt must be a valid date in YYYY-MM-DD format";
  }

  return null;
}

export function deriveWinnerId(match) {
  if (match.player1Score > match.player2Score) {
    return match.player1Id;
  }

  return match.player2Id;
}
