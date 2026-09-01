import { Link } from 'react-router-dom'
import Badge from '../atoms/Badge.jsx'
import TrophyIcon from '../atoms/TrophyIcon.jsx'
import { formatPercentage, formatStreak } from '../../utils/formatPercentage.js'

export default function LeaderboardRow({ entry, highlight = false }) {
  const streakVariant = entry.currentStreak?.type === 'W' ? 'win' : entry.currentStreak?.type === 'L' ? 'loss' : 'neutral'
  const rowClass = [entry.rank === 1 ? 'is-rank-1' : '', highlight ? 'updated-row' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <tr className={rowClass}>
      <td>
        <span className="leaderboard-rank">
          {entry.rank === 1 && <TrophyIcon size={14} className="rank-trophy" />}
          {entry.rank}
        </span>
      </td>
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
