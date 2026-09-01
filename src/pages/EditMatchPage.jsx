import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MatchForm from '../components/organisms/MatchForm.jsx'
import * as api from '../services/mockApi.js'

export default function EditMatchPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [seasons, setSeasons] = useState([])
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getPlayers(), api.getSeasons(), api.getMatch(id)])
      .then(([playersData, seasonsData, matchData]) => {
        if (cancelled) return
        setPlayers(playersData)
        setSeasons(seasonsData)
        if (!matchData) {
          setNotFound(true)
        } else {
          setMatch(matchData)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this match. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(formData) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.updateMatch(id, formData)
      navigate('/matches', { state: { updatedMatchId: Number(id) } })
    } catch {
      setSubmitError('Could not save changes. Please check the form and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Edit Match</h1>
      </div>

      {loading && <p className="state-message">Loading match...</p>}
      {!loading && loadError && <p className="state-message state-error">{loadError}</p>}
      {!loading && notFound && <p className="state-message state-error">Match not found.</p>}

      {!loading && !loadError && !notFound && match && (
        <div className="card">
          <MatchForm
            players={players}
            seasons={seasons}
            initialValues={{
              seasonId: String(match.seasonId),
              player1Id: String(match.player1Id),
              player2Id: String(match.player2Id),
              player1Score: String(match.player1Score),
              player2Score: String(match.player2Score),
              playedAt: match.playedAt,
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      )}
    </div>
  )
}
