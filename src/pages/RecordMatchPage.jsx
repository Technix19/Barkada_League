import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MatchForm from '../components/organisms/MatchForm.jsx'
import * as api from '../services/api.js'
import { useLeague } from '../auth/useLeague.js'
import { Link } from 'react-router-dom'
import { todayLocalDate } from '../utils/formatDate.js'

export default function RecordMatchPage() {
  const { leagueId } = useLeague()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.getPlayers(leagueId), api.getSeasons(leagueId)])
      .then(([playersData, seasonsData]) => {
        if (cancelled) return
        setPlayers(playersData)
        setSeasons(seasonsData)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load players and seasons. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [leagueId])

  async function handleSubmit(formData) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.createMatch(leagueId, formData)
      navigate('/leagues/' + leagueId, {
        state: {
          successMessage: 'Match recorded.',
          updatedPlayerIds: [Number(formData.player1Id), Number(formData.player2Id)],
        },
      })
    } catch (err) {
      setSubmitError(err.message || 'Could not save this match. Please check the form and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeSeason = seasons.find((s) => s.isActive) || seasons[0]

  const initialValues = {
    seasonId: activeSeason ? String(activeSeason.id) : '',
    player1Id: '',
    player2Id: '',
    player1Score: '',
    player2Score: '',
    playedAt: todayLocalDate(),
  }

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Record Match</h1>
      </div>

      {loading && <p className="state-message">Loading form...</p>}
      {!loading && loadError && <p className="state-message state-error">{loadError}</p>}

      {!loading && !loadError && (players.length < 2 || seasons.length === 0) && (
        <p className="state-message">Add at least two <Link to={'/leagues/' + leagueId + '/players'}>players</Link> and a <Link to={'/leagues/' + leagueId + '/seasons'}>season</Link> before recording a match.</p>
      )}
      {!loading && !loadError && players.length >= 2 && seasons.length > 0 && (
        <div className="card">
          <MatchForm
            players={players}
            seasons={seasons}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Save Match"
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      )}
    </div>
  )
}
