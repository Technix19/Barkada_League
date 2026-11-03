import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import Header from '../components/organisms/Header.jsx'
import { useAuth } from '../auth/useAuth.js'
import { getLeague } from '../services/api.js'

export default function LeagueLayout() {
  const { leagueId } = useParams()
  const { ready, session } = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    let active = true
    getLeague(leagueId).then((league) => {
      if (active) { setResult({ id: leagueId, league }); setError('') }
    }).catch((err) => {
      if (active) { setResult(null); setError(err.message) }
    })
    return () => { active = false }
  }, [leagueId, ready, session?.access_token])

  const league = result?.id === leagueId ? result.league : null
  const canManage = league?.role === 'owner' || league?.role === 'admin'

  return <>
    <Header league={league} canManage={canManage} />
    <main className="app-main">
      {!ready || (!league && !error)
        ? <div className="container page"><p className="state-message">Loading league...</p></div>
        : error
          ? <div className="container page"><h1 className="page-title">League unavailable</h1>
              <p className="state-message state-error">{error}</p>
              <Link to="/leagues">Back to My Leagues</Link></div>
          : <Outlet context={{ league, leagueId, canManage }} />}
    </main>
  </>
}
