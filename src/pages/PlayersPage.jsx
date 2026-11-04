import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeague } from '../auth/useLeague.js'
import * as api from '../services/api.js'

export default function PlayersPage() {
  const { leagueId, canManage } = useLeague()
  const [players, setPlayers] = useState(null)
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    api.getPlayers(leagueId).then((rows) => { if (active) setPlayers(rows) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [leagueId])

  async function addPlayer(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const player = await api.createPlayer(leagueId, { name: name.trim(), nickname: nickname.trim() || null })
      setPlayers((previous) => [...(previous || []), player].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setNickname('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return <div className="container page">
    <div className="page-header"><div>
      <h1 className="page-title">Players</h1>
      <p className="page-subtitle">Every competitor in this league, including friends without accounts.</p>
    </div></div>
    {error && <p className="form-banner-error" role="alert">{error}</p>}
    <div className="workspace-grid">
      <section className="card workspace-panel">
        <h2 className="section-title">Roster</h2>
        {!players && !error && <p className="state-message">Loading players...</p>}
        {players?.length === 0 && <p className="state-message">No players yet. {canManage ? 'Add your first player.' : 'The roster is empty.'}</p>}
        <div className="league-list">
          {players?.map((player) => <Link className="league-tile" key={player.id}
            to={'/leagues/' + leagueId + '/players/' + player.id}>
            <span><strong>{player.name}</strong><small>{player.nickname || 'View player stats'}</small></span>
            <span aria-hidden="true">→</span>
          </Link>)}
        </div>
      </section>
      {canManage && <section className="card workspace-panel">
        <h2 className="section-title">Add a player</h2>
        <p className="page-subtitle">Players don't need accounts to appear in your leaderboard.</p>
        <form onSubmit={addPlayer}>
          <label className="form-field">
            <span className="form-label">Full name</span>
            <input type="text" className="form-control" required maxLength="100"
              value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="form-field">
            <span className="form-label">Nickname (optional)</span>
            <input type="text" className="form-control" maxLength="100"
              value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Adding...' : 'Add player'}
          </button>
        </form>
      </section>}
    </div>
  </div>
}
