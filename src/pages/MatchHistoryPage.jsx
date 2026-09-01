import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Select from '../components/atoms/Select.jsx'
import MatchCard from '../components/molecules/MatchCard.jsx'
import * as api from '../services/api.js'

export default function MatchHistoryPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Captured once at mount, same reasoning as LeaderboardPage: stays
  // stable across in-page remounts (e.g. season toggling) for this visit.
  const [updatedMatchId] = useState(() => location.state?.updatedMatchId ?? null)

  // Scrub the transient state from this history entry so revisiting it
  // later (browser Back/Forward, or navigating back here) doesn't replay
  // the one-time highlight for a match that was edited long ago.
  useEffect(() => {
    if (location.state?.updatedMatchId != null) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [seasonMatches, setSeasonMatches] = useState(null)
  const [error, setError] = useState(null)
  const [matchPendingDelete, setMatchPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

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
    api
      .getMatches(selectedSeasonId)
      .then((data) => {
        if (cancelled) return
        setError(null)
        setSeasonMatches({ seasonId: selectedSeasonId, matches: data })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load match history. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [selectedSeasonId, refreshIndex])

  const loading =
    !error && (!seasonMatches || seasonMatches.seasonId !== selectedSeasonId)
  const matches = seasonMatches?.matches ?? []

  async function handleConfirmDelete(matchId) {
    setDeleteError(null)
    try {
      await api.deleteMatch(matchId)
      setMatchPendingDelete(null)
      setRefreshIndex((n) => n + 1)
    } catch {
      setDeleteError('Could not delete this match. Please try again.')
    }
  }

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Match History</h1>
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

      {deleteError && <p className="state-message state-error">{deleteError}</p>}

      {loading && <p className="state-message">Loading match history...</p>}
      {!loading && error && <p className="state-message state-error">{error}</p>}

      {!loading && !error && (
        matches.length === 0 ? (
          <p className="state-message">No matches found for this season.</p>
        ) : (
          <div className="match-list">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showActions
                highlight={match.id === updatedMatchId}
                isPendingDelete={matchPendingDelete === match.id}
                onDeleteClick={setMatchPendingDelete}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={() => setMatchPendingDelete(null)}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}
