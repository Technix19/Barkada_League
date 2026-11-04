import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../auth/supabase.js'
import { useAuth } from '../auth/useAuth.js'

export default function AuthPage({ mode = 'login' }) {
  const signup = mode === 'signup'
  const { user, ready, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (!ready) return <div className="container page"><p className="state-message">Loading session...</p></div>
  if (user) return <Navigate to="/leagues" replace />

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    try {
      if (!supabase) throw new Error('Authentication has not been configured yet.')
      if (signup) {
        if (password.length < 8) throw new Error('Use at least 8 characters for your password.')
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + '/login' },
        })
        if (authError) throw authError
        if (data.session) {
          navigate('/leagues', { replace: true })
        } else {
          setNotice('Account request accepted. If email confirmation is enabled, check your inbox to verify your address before signing in.')
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
        })
        if (authError) throw authError
        navigate('/leagues', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="container page">
      <div className="card auth-card">
        <h1 className="page-title">{signup ? 'Create an account' : 'Welcome back'}</h1>
        <p className="page-subtitle">{signup ? 'Start a league with your friends.' : 'Sign in to manage your leagues.'}</p>
        {!configured && <p role="alert" className="state-message state-error">Auth is not configured for this deployment.</p>}
        {error && <p role="alert" className="form-banner-error">{error}</p>}
        {notice && <p role="status" className="success-banner">{notice}</p>}
        <form onSubmit={submit}>
          <label className="form-field">
            <span className="form-label">Email</span>
            <input className="form-control" type="email" autoComplete="email" required
              maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="form-field">
            <span className="form-label">Password</span>
            <input className="form-control" type="password" minLength={signup ? 8 : undefined}
              autoComplete={signup ? 'new-password' : 'current-password'} required
              value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="btn btn-primary auth-submit" disabled={pending || !configured} type="submit">
            {pending ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="page-subtitle auth-switch">
          {signup ? 'Already have an account?' : 'New to Barkada League?'}{' '}
          <Link to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link>
        </p>
        <p className="page-subtitle auth-switch"><Link to="/demo">Explore the demo without an account</Link></p>
      </div>
    </div>
  )
}
