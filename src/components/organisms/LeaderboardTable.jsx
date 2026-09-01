import { Link } from 'react-router-dom'
import Badge from '../atoms/Badge.jsx'
import TrophyIcon from '../atoms/TrophyIcon.jsx'
import LeaderboardRow from '../molecules/LeaderboardRow.jsx'
import { formatPercentage, formatStreak } from '../../utils/formatPercentage.js'

export default function LeaderboardTable({ standings, highlightPlayerIds = [] }) {
  return (
    <>
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col">W</th>
              <th scope="col">L</th>
              <th scope="col">Played</th>
              <th scope="col">Win %</th>
              <th scope="col">Streak</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry) => (
              <LeaderboardRow
                key={entry.playerId}
                entry={entry}
                highlight={highlightPlayerIds.includes(entry.playerId)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-cards">
        {standings.map((entry) => {
          const streakVariant =
            entry.currentStreak?.type === 'W' ? 'win' : entry.currentStreak?.type === 'L' ? 'loss' : 'neutral'
          const rankClass = entry.rank === 1 ? ' is-rank-1' : ''
          const highlightClass = highlightPlayerIds.includes(entry.playerId) ? ' updated-row' : ''
          return (
            <div className={`leaderboard-card${rankClass}${highlightClass}`} key={entry.playerId}>
              <div className="leaderboard-card-rank">
                {entry.rank === 1 && <TrophyIcon size={16} className="rank-trophy" />}
                {entry.rank}
              </div>
              <div className="leaderboard-card-body">
                <Link to={`/players/${entry.playerId}`} className="leaderboard-card-name">
                  {entry.name}
                </Link>
                <div className="leaderboard-card-stats">
                  {entry.wins}W · {entry.losses}L · {formatPercentage(entry.winPercentage)}
                </div>
              </div>
              <Badge variant={streakVariant}>{formatStreak(entry.currentStreak)}</Badge>
            </div>
          )
        })}
      </div>
    </>
  )
}
