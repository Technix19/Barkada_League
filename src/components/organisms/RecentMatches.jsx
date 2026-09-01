import MatchCard from '../molecules/MatchCard.jsx'

export default function RecentMatches({ matches, emptyMessage = 'No matches have been recorded yet.' }) {
  if (matches.length === 0) {
    return <p className="state-message">{emptyMessage}</p>
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
