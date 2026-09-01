export function formatPercentage(value) {
  return `${value}%`
}

export function formatStreak(streak) {
  if (!streak || !streak.type) return '—'
  return `${streak.type}${streak.count}`
}
