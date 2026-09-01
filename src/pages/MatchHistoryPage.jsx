import { useEffect, useState } from 'react'
import Select from '../components/atoms/Select.jsx'
import MatchCard from '../components/molecules/MatchCard.jsx'
import * as api from '../services/mockApi.js'

export default function MatchHistoryPage() {
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
