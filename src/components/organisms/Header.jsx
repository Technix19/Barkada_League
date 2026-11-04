import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'

export default function Header({ league = null, canManage = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const root = league ? '/leagues/' + league.id : ''
  const links = league
    ? [
      { to: root, label: 'Leaderboard', end: true },
      { to: root + '/matches', label: 'Matches' },
      { to: root + '/players', label: 'Players' },
      { to: root + '/seasons', label: 'Seasons' },
      ...(canManage ? [{ to: root + '/matches/new', label: 'Record Match' }] : []),
    ]
    : [
      { to: '/demo', label: 'Explore Demo' },
      ...(user ? [{ to: '/leagues', label: 'My Leagues' }] : []),
    ]

  async function logout() {
    setError('')
    try {
      await signOut()
      setMenuOpen(false)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign out.')
    }
  }

  return (
    <header className="header">
      <div className={'container header-inner' + (league ? ' header-inner--league' : '')}>
        <Link to={user ? '/leagues' : '/demo'} className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="" className="brand-logo" width="32" height="32" />
          Barkada League
        </Link>
        {league && <span className="league-context-name" title={league.name}>{league.name}</span>}
        <button type="button" className="nav-toggle" aria-expanded={menuOpen}
          aria-label="Toggle navigation menu" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? '✕' : '☰'}
        </button>
        <nav aria-label="Main navigation" className={'nav-links' + (menuOpen ? ' open' : '')}>
          {league && <Link className="nav-link" to={user ? '/leagues' : '/demo'} onClick={() => setMenuOpen(false)}>
            {user ? 'My Leagues' : 'Demo'}
          </Link>}
          {links.map((item) => <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            onClick={() => setMenuOpen(false)}>{item.label}</NavLink>)}
          {user
            ? <button type="button" className="nav-link nav-button" onClick={logout}>Sign out</button>
            : <NavLink to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Sign in</NavLink>}
          {!user && <NavLink to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>
            Sign up
          </NavLink>}
        </nav>
        {error && <p className="header-error" role="alert">{error}</p>}
      </div>
    </header>
  )
}
