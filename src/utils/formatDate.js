// Formats a "YYYY-MM-DD" date-only string without going through a Date
// object at UTC midnight, which can shift the displayed day by one
// depending on the viewer's timezone.
export function formatDate(isoDateString) {
  if (!isoDateString) return ''
  const [year, month, day] = isoDateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatJoinMonth(isoDateString) {
  if (!isoDateString) return ''
  const [year, month, day] = isoDateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export function todayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
