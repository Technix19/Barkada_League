import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Select from '../components/atoms/Select.jsx'
import MatchCard from '../components/molecules/MatchCard.jsx'
import { useLeague } from '../auth/useLeague.js'
import * as api from '../services/api.js'

const PAGE_SIZE = 25

export default function MatchHistoryPage() {
  const { leagueId, canManage } = useLeague()
  const location = useLocation()
  const navigate = useNavigate()
  const [updatedMatchId] = useState(() => location.state?.updatedMatchId ?? null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [pageData, setPageData] = useState(null)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (location.state?.updatedMatchId != null) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  useEffect(() => {
    let active = true
    api.getSeasons(leagueId).then((rows) => {
      if (!active) return
      setSeasons(rows)
      const season = rows.find((s) => s.isActive) || rows[0]
      setSelectedSeasonId(season ? String(season.id) : '')
    }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [leagueId])

  useEffect(() => {
    if (!selectedSeasonId) return
    let active = true
    api.getMatches(leagueId, selectedSeasonId, PAGE_SIZE).then((rows) => {
      if (!active) return
      setPageData({ seasonId: selectedSeasonId, matches: rows, hasMore: rows.length === PAGE_SIZE })
      setError('')
    }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [leagueId, selectedSeasonId, refresh])

  async function loadMore() {
    const current = pageData
    if (!current || !current.hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await api.getMatches(leagueId, current.seasonId, PAGE_SIZE, current.matches.length)
      setPageData((old) => old?.seasonId === current.seasonId
        ? { seasonId: current.seasonId, matches: [...old.matches, ...rows], hasMore: rows.length === PAGE_SIZE }
        : old)
    } catch (err) { setError(err.message) }
    finally { setLoadingMore(false) }
  }

  async function confirmDelete(matchId) {
    setError('')
    setDeleting(true)
    try {
      await api.deleteMatch(leagueId, matchId)
      setPendingDelete(null)
      setRefresh((n) => n + 1)
    } catch (err) { setError(err.message) }
    finally { setDeleting(false) }
  }

  const loading = selectedSeasonId && pageData?.seasonId !== selectedSeasonId
  const data = pageData?.seasonId === selectedSeasonId ? pageData : null

  return <div className="container page">
    <div className="page-header">
      <div><h1 className="page-title">Match History</h1>
        <p className="page-subtitle">Results from this league only.</p></div>
      <div className="page-header-actions">
        {seasons.length > 0 && <Select className="season-select" aria-label="Select season"
          value={selectedSeasonId} onChange={(event) => setSelectedSeasonId(event.target.value)}>
          {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
        </Select>}
        {canManage && <Link to={'/leagues/' + leagueId + '/matches/new'} className="btn btn-primary">Record Match</Link>}
      </div>
    </div>
    {error && <p role="alert" className="form-banner-error">{error}</p>}
    {!selectedSeasonId && !error && <p className="state-message">
      No seasons yet. {canManage && <Link to={'/leagues/' + leagueId + '/seasons'}>Create one</Link>}
    </p>}
    {loading && !error && <p className="state-message">Loading matches...</p>}
    {data && !loading && data.matches.length === 0 && <p className="state-message">
      No matches have been recorded for this season.
    </p>}
    {data && !loading && <div className="match-list">
      {data.matches.map((match) => <MatchCard key={match.id} match={match} leagueId={leagueId}
        showActions={canManage && !deleting} highlight={match.id === updatedMatchId}
        isPendingDelete={pendingDelete === match.id} onDeleteClick={setPendingDelete}
        onConfirmDelete={confirmDelete} onCancelDelete={() => setPendingDelete(null)} />)}
      {data.hasMore && <button type="button" className="btn btn-secondary"
        onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load older matches'}</button>}
    </div>}
  </div>
}
