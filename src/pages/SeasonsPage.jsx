import { useEffect, useState } from 'react'
import { useLeague } from '../auth/useLeague.js'
import { todayLocalDate } from '../utils/formatDate.js'
import * as api from '../services/api.js'

export default function SeasonsPage() {
  const { leagueId, canManage } = useLeague()
  const [seasons, setSeasons] = useState(null)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayLocalDate())
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    api.getSeasons(leagueId).then((rows) => { if (active) setSeasons(rows) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [leagueId])

  async function create(event) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const created = await api.createSeason(leagueId, {
        name: name.trim(), startDate, isActive: true,
      })
      setSeasons((old) => [created, ...(old || []).map((s) => ({ ...s, isActive: false }))])
      setName('')
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }

  async function activate(seasonId) {
    setPending(true)
    setError('')
    try {
      await api.activateSeason(leagueId, seasonId)
      setSeasons((old) => old.map((s) => ({ ...s, isActive: s.id === seasonId })))
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }

  return <div className="container page">
    <div className="page-header"><div>
      <h1 className="page-title">Seasons</h1>
      <p className="page-subtitle">Start a fresh competition without losing previous results.</p>
    </div></div>
    {error && <p className="form-banner-error" role="alert">{error}</p>}
    <div className="workspace-grid">
      <section className="card workspace-panel">
        <h2 className="section-title">League seasons</h2>
        {!seasons && !error && <p className="state-message">Loading seasons...</p>}
        {seasons?.length === 0 && <p className="state-message">No seasons yet. Create your first season to begin.</p>}
        <div className="league-list">
          {seasons?.map((season) => <div key={season.id} className="league-tile season-tile">
            <span><strong>{season.name}</strong>
              <small>{season.startDate}{season.isActive ? ' · Active season' : ' · Past season'}</small>
            </span>
            {canManage && !season.isActive && <button type="button" className="btn btn-secondary btn-sm"
              onClick={() => activate(season.id)} disabled={pending}>Make active</button>}
            {season.isActive && <span className="season-active">Active</span>}
          </div>)}
        </div>
      </section>
      {canManage && <section className="card workspace-panel">
        <h2 className="section-title">Start a season</h2>
        <p className="page-subtitle">Creating a new active season archives the previous active one.</p>
        <form onSubmit={create}>
          <label className="form-field">
            <span className="form-label">Season name</span>
            <input type="text" className="form-control" maxLength="100" required
              placeholder="Season 1" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="form-field">
            <span className="form-label">Start date</span>
            <input type="date" className="form-control" required value={startDate}
              onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={pending || !name.trim()}>
            {pending ? 'Creating...' : 'Create season'}
          </button>
        </form>
      </section>}
    </div>
  </div>
}
