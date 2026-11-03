import { Link, Outlet } from 'react-router-dom'
import { useLeague } from '../auth/useLeague.js'

export default function ManagerOnly() {
  const context = useLeague()
  if (!context.canManage) {
    return <div className="container page">
      <h1 className="page-title">Administrator access required</h1>
      <p className="state-message">Only league owners and administrators may change results.</p>
      <Link to={'/leagues/' + context.leagueId}>Back to leaderboard</Link>
    </div>
  }
  return <Outlet context={context} />
}
