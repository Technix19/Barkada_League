// Parses a route/query parameter as a positive integer id.
// Returns null if the value is missing, non-numeric, zero, or negative.
export function parsePositiveInt(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}
