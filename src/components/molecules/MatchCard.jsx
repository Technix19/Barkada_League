import { Link } from 'react-router-dom'
import Badge from '../atoms/Badge.jsx'
import Button from '../atoms/Button.jsx'
import { formatDate } from '../../utils/formatDate.js'

export default function MatchCard({
  match,
  showActions = false,
  perspectivePlayerId = null,
  highlight = false,
  isPendingDelete = false,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}) {
  const { player1, player2, player1Score, player2Score, winnerId, playedAt } = match
  const cardClass = `match-card${highlight ? ' updated-row' : ''}`

  if (perspectivePlayerId != null) {
    const isPlayer1 = String(player1.id) === String(perspectivePlayerId)
    const opponent = isPlayer1 ? player2 : player1
    const ownScore = isPlayer1 ? player1Score : player2Score
    const opponentScore = isPlayer1 ? player2Score : player1Score
    const won = String(winnerId) === String(perspectivePlayerId)

    return (
      <div className={cardClass}>
        <div className="match-card-row">
          <span className="match-card-date">{formatDate(playedAt)}</span>
          <div className="match-card-matchup">
            <Badge variant={won ? 'win' : 'loss'} className="match-card-perspective">
              {won ? 'W' : 'L'}
            </Badge>
            <span className="match-card-player">
              vs{' '}
              <Link to={`/players/${opponent.id}`} className="leaderboard-player-link">
                {opponent.name}
              </Link>
            </span>
            <span className="match-card-score">
              {ownScore} - {opponentScore}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const p1Winner = String(winnerId) === String(player1.id)
  const p2Winner = String(winnerId) === String(player2.id)

  return (
    <div className={cardClass}>
      <div className="match-card-row">
        <span className="match-card-date">{formatDate(playedAt)}</span>

        <div className="match-card-matchup">
          <span className={`match-card-player${p1Winner ? ' winner' : ''}`}>
            <Link to={`/players/${player1.id}`} className="leaderboard-player-link">
              {player1.name}
            </Link>
          </span>
          <span className="match-card-score">
            {player1Score} - {player2Score}
          </span>
          <span className={`match-card-player match-card-player-right${p2Winner ? ' winner' : ''}`}>
            <Link to={`/players/${player2.id}`} className="leaderboard-player-link">
              {player2.name}
            </Link>
          </span>
        </div>

        {showActions && (
          <div className="match-card-actions">
            <Link to={`/matches/${match.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </Link>
            <Button variant="danger" className="btn-sm" onClick={() => onDeleteClick(match.id)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {isPendingDelete && (
        <div className="match-card-confirm" role="alertdialog" aria-label="Confirm delete">
          <span className="match-card-confirm-text">
            Delete this match? This will also change leaderboard statistics.
          </span>
          <div className="match-card-actions">
            <Button variant="secondary" className="btn-sm" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" className="btn-sm" onClick={() => onConfirmDelete(match.id)}>
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
