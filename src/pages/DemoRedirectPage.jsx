import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDemoLeague } from '../services/api.js'

export default function DemoRedirectPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getDemoLeague().then((league) => {
      if (active) navigate('/leagues/' + league.id, { replace: true })
    }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [navigate])
  return <div className="container page">
    <p className="state-message">{error || 'Opening demo league...'}</p>
    {error && <p className="page-subtitle"><Link to="/login">Sign in instead</Link></p>}
  </div>
}
