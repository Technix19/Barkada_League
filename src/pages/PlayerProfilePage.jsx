import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Select from '../components/atoms/Select.jsx'
import StatCard from '../components/molecules/StatCard.jsx'
import MatchCard from '../components/molecules/MatchCard.jsx'
import * as api from '../services/mockApi.js'
import { formatJoinMonth } from '../utils/formatDate.js'
import { formatPercentage, formatStreak } from '../utils/formatPercentage.js'

export default function PlayerProfilePage() {
  const { id } = useParams()
  const [player, setPlayer] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [profileData, setProfileData] = useState(null)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getPlayer(id), api.getSeasons()])
      .then(([playerData, seasonsData]) => {
        if (cancelled) return
        if (!playerData) {
          setNotFound(true)
          return
        }
        setNotFound(false)
        setPlayer(playerData)
        setSeasons(seasonsData)
        const active = seasonsData.find((s) => s.isActive) || seasonsData[0]
        setSelectedSeasonId(active ? String(active.id) : '')
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this player. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!selectedSeasonId || notFound) return
    let cancelled = false

    Promise.all([
      api.getPlayerStats(id, selectedSeasonId),
      api.getMatches(selectedSeasonId),
    ])
      .then(([statsData, matchesData]) => {
        if (cancelled) return
        setError(null)
        setProfileData({
          seasonId: selectedSeasonId,
          stats: statsData,
          recentMatches: matchesData.filter(
            (m) => String(m.player1Id) === String(id) || String(m.player2Id) === String(id),
          ),
        })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this player’s stats. Please try again.')
      })

    return () => {
      cancelled = true
    }
  }, [id, selectedSeasonId, notFound])

  const loading =
    !error && (!profileData || profileData.seasonId !== selectedSeasonId)
  const stats = profileData?.stats ?? null
  const recentMatches = profileData?.recentMatches ?? []

  if (notFound) {
    return (
      <div className="container page">
        <Link to="/" className="back-link">
          ← Leaderboard
        </Link>
        <p className="state-message state-error">Player not found.</p>
      </div>
    )
  }

  return (
    <div className="container page">
      <Link to="/" className="back-link">
        ← Leaderboard
      </Link>

      {!player && !error && <p className="state-message">Loading player...</p>}
      {error && <p className="state-message state-error">{error}</p>}

      {player && (
        <>
          <div className="page-header player-heading">
            <div>
              <div className="player-name">{player.name}</div>
              {player.nickname && <div className="player-nickname">"{player.nickname}"</div>}
              <div className="player-joined">Joined {formatJoinMonth(player.joinDate)}</div>
            </div>
            {seasons.length > 0 && (
              <Select
                className="season-select"
                aria-label="Select season"
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {loading && <p className="state-message">Loading stats...</p>}

          {!loading && stats && (
            <>
              <div className="stat-grid">
                <StatCard value={stats.wins} label="Wins" />
                <StatCard value={stats.losses} label="Losses" />
                <StatCard value={formatPercentage(stats.winPercentage)} label="Win Rate" />
                <StatCard value={formatStreak(stats.currentStreak)} label="Current Streak" />
              </div>

              <div className="section">
                <h2 className="section-title">Recent Matches</h2>
                {recentMatches.length === 0 ? (
                  <p className="state-message">
                    This player has not played any matches this season.
                  </p>
                ) : (
                  <div className="match-list">
                    {recentMatches.map((match) => (
                      <MatchCard key={match.id} match={match} perspectivePlayerId={id} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
