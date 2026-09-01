import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Select from '../components/atoms/Select.jsx'
import LeaderboardTable from '../components/organisms/LeaderboardTable.jsx'
import RecentMatches from '../components/organisms/RecentMatches.jsx'
import * as api from '../services/mockApi.js'

export default function LeaderboardPage() {
  const location = useLocation()
  const successMessage = location.state?.successMessage
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .getSeasons()
      .then((data) => {
        if (cancelled) return
        setSeasons(data)
        const active = data.find((s) => s.isActive) || data[0]
        setSelectedSeasonId(active ? String(active.id) : '')
      })
      .catch(() => {
        if (!cancelled) setError('Could not load seasons.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSeasonId) return
    let cancelled = false

    Promise.all([
      api.getLeaderboard(selectedSeasonId),
      api.getRecentMatchesForSeason(selectedSeasonId, 5),
    ])
      .then(([standingsData, matchesData]) => {
        if (cancelled) return
        setError(null)
        setLeaderboardData({
          seasonId: selectedSeasonId,
          standings: standingsData,
          recentMatches: matchesData,
        })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the leaderboard. Please try again.')
      })

    return () => {
      cancelled = true
    }
  }, [selectedSeasonId])

  const loading =
    !error && (!leaderboardData || leaderboardData.seasonId !== selectedSeasonId)
  const standings = leaderboardData?.standings ?? []
  const recentMatches = leaderboardData?.recentMatches ?? []
  const hasAnyMatches = standings.some((entry) => entry.matchesPlayed > 0)

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
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

      {successMessage && <p className="success-banner">{successMessage}</p>}

      {loading && <p className="state-message">Loading leaderboard...</p>}

      {!loading && error && <p className="state-message state-error">{error}</p>}

      {!loading && !error && (
        <>
          {hasAnyMatches ? (
            <LeaderboardTable standings={standings} />
          ) : (
            <p className="state-message">
              No matches have been recorded for this season yet. Record the first match to start
              the leaderboard.
            </p>
          )}

          <div className="section">
            <h2 className="section-title">Recent Matches</h2>
            <RecentMatches matches={recentMatches} />
          </div>

          <div className="section form-actions">
            <Link to="/matches/new" className="btn btn-primary">
              Record Match
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
