import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Header from './components/organisms/Header.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DemoRedirectPage from './pages/DemoRedirectPage.jsx'
import LeagueDashboardPage from './pages/LeagueDashboardPage.jsx'
import LeagueLayout from './layouts/LeagueLayout.jsx'
import ManagerOnly from './layouts/ManagerOnly.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import RecordMatchPage from './pages/RecordMatchPage.jsx'
import MatchHistoryPage from './pages/MatchHistoryPage.jsx'
import EditMatchPage from './pages/EditMatchPage.jsx'
import PlayerProfilePage from './pages/PlayerProfilePage.jsx'
import PlayersPage from './pages/PlayersPage.jsx'
import SeasonsPage from './pages/SeasonsPage.jsx'
import { useAuth } from './auth/useAuth.js'

function GeneralLayout() {
  return <><Header /><main className="app-main"><Outlet /></main></>
}
function Home() {
  const { user, ready } = useAuth()
  if (!ready) return <div className="container page"><p className="state-message">Loading...</p></div>
  return <Navigate to={user ? '/leagues' : '/demo'} replace />
}
function NotFound() {
  return <div className="container page">
    <h1 className="page-title">Page not found</h1>
    <Link to="/">Return home</Link>
  </div>
}

export default function App() {
  return <Routes>
    <Route element={<GeneralLayout />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/demo" element={<DemoRedirectPage />} />
      <Route path="/leagues" element={<LeagueDashboardPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="/leagues/:leagueId" element={<LeagueLayout />}>
      <Route index element={<LeaderboardPage />} />
      <Route path="matches" element={<MatchHistoryPage />} />
      <Route path="players" element={<PlayersPage />} />
      <Route path="seasons" element={<SeasonsPage />} />
      <Route path="players/:id" element={<PlayerProfilePage />} />
      <Route element={<ManagerOnly />}>
        <Route path="matches/new" element={<RecordMatchPage />} />
        <Route path="matches/:id/edit" element={<EditMatchPage />} />
      </Route>
    </Route>
  </Routes>
}
