import { Link } from 'react-router-dom'
import Badge from '../atoms/Badge.jsx'
import { formatPercentage, formatStreak } from '../../utils/formatPercentage.js'

export default function LeaderboardRow({ entry }) {
  const streakVariant = entry.currentStreak.type === 'W' ? 'win' : entry.currentStreak.type === 'L' ? 'loss' : 'neutral'

  return (
    <tr>
      <td className="leaderboard-rank">{entry.rank}</td>
      <td>
        <Link to={`/players/${entry.playerId}`} className="leaderboard-player-link">
          {entry.name}
        </Link>{' '}
        {entry.nickname && <span className="leaderboard-nickname">"{entry.nickname}"</span>}
      </td>
      <td>{entry.wins}</td>
      <td>{entry.losses}</td>
      <td>{entry.matchesPlayed}</td>
      <td>{formatPercentage(entry.winPercentage)}</td>
      <td>
        <Badge variant={streakVariant}>{formatStreak(entry.currentStreak)}</Badge>
      </td>
    </tr>
  )
}
