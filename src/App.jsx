import { Link, Outlet, Route, Routes } from 'react-router-dom'
import Header from './components/organisms/Header.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import RecordMatchPage from './pages/RecordMatchPage.jsx'
import MatchHistoryPage from './pages/MatchHistoryPage.jsx'
import EditMatchPage from './pages/EditMatchPage.jsx'
import PlayerProfilePage from './pages/PlayerProfilePage.jsx'

function Layout() {
  return (
    <>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  )
}

function NotFoundPage() {
  return (
    <div className="container page">
      <p className="state-message">
        Page not found. <Link to="/">Return to the leaderboard.</Link>
      </p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LeaderboardPage />} />
        <Route path="/matches" element={<MatchHistoryPage />} />
        <Route path="/matches/new" element={<RecordMatchPage />} />
        <Route path="/matches/:id/edit" element={<EditMatchPage />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
