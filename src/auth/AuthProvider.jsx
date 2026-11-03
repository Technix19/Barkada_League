import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { supabase } from './supabase.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next)
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('Session restoration failed:', error.message)
      setSession(data.session)
      setReady(true)
    }).catch((error) => {
      if (!active) return
      console.error('Session restoration failed:', error.message)
      setReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    ready,
    configured: Boolean(supabase),
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }), [session, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
