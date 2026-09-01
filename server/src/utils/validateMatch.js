// Shared match validation for POST /api/matches and PATCH /api/matches/:id.
// The server is the sole authority on winnerId -- callers derive it with
// deriveWinnerId() after validation passes; it is never accepted from the
// client (see checkBodyShape).

export const MATCH_FIELDS = [
  'seasonId',
  'player1Id',
  'player2Id',
  'player1Score',
  'player2Score',
  'playedAt',
]

function isPositiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isNonNegativeInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

// Strict YYYY-MM-DD check that also rejects impossible calendar dates
// (e.g. 2026-02-30) by round-tripping through UTC date components --
// UTC avoids any local-timezone shift during the check itself.
function isValidCalendarDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

// Validates the raw request body shape before any merging happens.
// Returns an error string, or null if the shape is acceptable.
export function checkBodyShape(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object'
  }
  if (Object.prototype.hasOwnProperty.call(body, 'winnerId')) {
    return 'winnerId is derived from scores and must not be provided'
  }
  const unsupported = Object.keys(body).filter((key) => !MATCH_FIELDS.includes(key))
  if (unsupported.length > 0) {
    return `Unsupported field(s): ${unsupported.join(', ')}`
  }
  return null
}

// Validates a fully-populated match object (all six MATCH_FIELDS present).
// Returns an error string, or null if valid.
export function validateCompleteMatch(match) {
  if (!isPositiveInteger(match.seasonId)) {
    return 'seasonId must be a positive integer'
  }
  if (!isPositiveInteger(match.player1Id)) {
    return 'player1Id must be a positive integer'
  }
  if (!isPositiveInteger(match.player2Id)) {
    return 'player2Id must be a positive integer'
  }
  if (match.player1Id === match.player2Id) {
    return 'Players must be different'
  }
  if (!isNonNegativeInteger(match.player1Score)) {
    return 'player1Score must be a non-negative integer'
  }
  if (!isNonNegativeInteger(match.player2Score)) {
    return 'player2Score must be a non-negative integer'
  }
  if (match.player1Score === match.player2Score) {
    return 'Scores cannot be tied'
  }
  if (!isValidCalendarDateString(match.playedAt)) {
    return 'playedAt must be a valid date in YYYY-MM-DD format'
  }
  return null
}

export function deriveWinnerId(match) {
  return match.player1Score > match.player2Score ? match.player1Id : match.player2Id
}
