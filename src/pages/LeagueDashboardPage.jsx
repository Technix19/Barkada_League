import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import * as api from '../services/api.js'

export default function LeagueDashboardPage() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState(null)
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!ready || !user) return
    let active = true
    api.getMyLeagues().then((data) => {
      if (active) setLeagues(data)
    }).catch((err) => {
      if (active) setError(err.message)
    })
    return () => { active = false }
  }, [ready, user])

  if (!ready) return <div className="container page"><p className="state-message">Loading...</p></div>
  if (!user) return <Navigate to="/login" replace />

  async function create(event) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const league = await api.createLeague({ name: name.trim(), isPublic })
      navigate('/leagues/' + league.id, { replace: false })
    } catch (err) {
      setError(err.message || 'Could not create a league.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="container page">
      <div className="page-header">
        <div><h1 className="page-title">My Leagues</h1>
          <p className="page-subtitle">Your home for every friendly rivalry.</p></div>
      </div>
      {error && <p role="alert" className="form-banner-error">{error}</p>}
      <div className="workspace-grid">
        <section className="card workspace-panel">
          <h2 className="section-title">Your leagues</h2>
          {!leagues && !error && <p className="state-message">Loading leagues...</p>}
          {leagues?.length === 0 && <p className="state-message">
            No leagues yet. Create one to start tracking your matches!
          </p>}
          <div className="league-list">
            {leagues?.map((league) => (
              <Link key={league.id} to={'/leagues/' + league.id} className="league-tile">
                <span><strong>{league.name}</strong>
                  <small>{league.isPublic ? 'Public' : 'Private'} · {league.role}</small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <p className="page-subtitle auth-switch">Just exploring? <Link to="/demo">Open the demo league</Link>.</p>
        </section>
        <section className="card workspace-panel">
          <h2 className="section-title">Create a league</h2>
          <p className="page-subtitle">Give your group a name, then add players and a season.</p>
          <form onSubmit={create}>
            <label className="form-field">
              <span className="form-label">League name</span>
              <input className="form-control" type="text" minLength="2" maxLength="100"
                value={name} onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Friday Badminton Crew" required />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)} />
              <span>Make leaderboard and results viewable to anyone with the link</span>
            </label>
            <button className="btn btn-primary" type="submit" disabled={pending || name.trim().length < 2}>
              {pending ? 'Creating...' : 'Create league'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
