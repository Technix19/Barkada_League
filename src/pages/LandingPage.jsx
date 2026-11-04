import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import '../styles/landing.css'

const players = [
  { name: 'Mika', initials: 'MK', played: 12, wins: 10, score: '10–2', color: 'violet' },
  { name: 'Alex', initials: 'AL', played: 12, wins: 8, score: '8–4', color: 'teal' },
  { name: 'Sam', initials: 'SM', played: 11, wins: 7, score: '7–4', color: 'blue' },
  { name: 'Jamie', initials: 'JM', played: 12, wins: 6, score: '6–6', color: 'amber' },
]

function Icon({ name, size = 20, className = '' }) {
  const shapes = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-8M22 20v-5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" /><path d="m19 18 .5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5L19 18Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="M5 5 19 19M19 5 5 19" /></>,
    play: <path d="m9 6 10 6-10 6V6Z" />,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  }
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>
}

function ActionLink({ to, children, secondary = false, className = '' }) {
  return <Link className={'lp-button ' + (secondary ? 'lp-button-ghost ' : 'lp-button-primary ') + className} to={to}>{children}<Icon name="arrow" size={17} /></Link>
}

function LandingHeader({ primaryTo, isSignedIn }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="lp-header">
      <div className="lp-container lp-header-row">
        <Link to="/" className="lp-brand" aria-label="Barkada League home" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="" width="34" height="34" />
          <span>Barkada League</span>
        </Link>
        <button type="button" className="lp-menu-toggle" aria-expanded={open} aria-controls="lp-nav-links" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
        <nav id="lp-nav-links" aria-label="Landing page navigation" className={'lp-nav' + (open ? ' is-open' : '')}>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
          <Link to="/demo" onClick={() => setOpen(false)}>Explore demo</Link>
          <div className="lp-nav-actions">
            {!isSignedIn && <Link className="lp-nav-login" to="/login" onClick={() => setOpen(false)}>Log in</Link>}
            <Link className="lp-nav-cta" to={primaryTo} onClick={() => setOpen(false)}>
              {isSignedIn ? 'My leagues' : 'Get started'} <Icon name="arrow" size={15} />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

function LeaderboardPreview() {
  return (
    <div className="lp-preview-stage" aria-label="Illustrative preview of a Barkada League leaderboard">
      <div className="lp-preview-halo" aria-hidden="true" />
      <div className="lp-app-window">
        <div className="lp-app-topbar">
          <div className="lp-dots" aria-hidden="true"><i /><i /><i /></div>
          <span>League dashboard</span>
          <span className="lp-app-topbar-label">PREVIEW</span>
        </div>
        <div className="lp-app-inner">
          <aside className="lp-app-sidebar" aria-hidden="true">
            <div className="lp-sidebar-brand"><Icon name="trophy" size={15} /> BL</div>
            <span className="lp-sidebar-item active"><Icon name="chart" size={15} /> Leaderboard</span>
            <span className="lp-sidebar-item"><Icon name="calendar" size={15} /> Matches</span>
            <span className="lp-sidebar-item"><Icon name="users" size={15} /> Players</span>
            <span className="lp-sidebar-item"><Icon name="target" size={15} /> Seasons</span>
            <div className="lp-sidebar-bottom"><span className="lp-sidebar-avatar">F</span> Friday Crew</div>
          </aside>
          <div className="lp-app-content">
            <div className="lp-app-eyebrow"><span className="lp-green-dot" /> FRIDAY CREW <span className="lp-app-divider">/</span> SEASON 01</div>
            <div className="lp-app-title-row">
              <div><div className="lp-app-title">Leaderboard</div><div className="lp-app-desc">Every match moves the standings.</div></div>
              <span className="lp-season-tag"><Icon name="trophy" size={13} /> Current season</span>
            </div>
            <div className="lp-leaderboard-grid">
              <div className="lp-leaderboard-head"><span>RANK / PLAYER</span><span>W–L</span><span>WIN RATE</span></div>
              {players.map((player, index) => (
                <div className={'lp-leaderboard-row' + (index === 0 ? ' first' : '')} key={player.name}>
                  <div className="lp-leaderboard-player">
                    <span className="lp-rank">{String(index + 1).padStart(2, '0')}</span>
                    <span className={'lp-player-avatar ' + player.color}>{player.initials}</span>
                    <span>{player.name}{index === 0 && <span className="lp-player-crown"><Icon name="trophy" size={13} /></span>}</span>
                  </div>
                  <span className="lp-record">{player.score}</span>
                  <div className="lp-winrate"><span className="lp-rate-track"><i style={{ width: (player.wins / player.played) * 100 + '%' }} /></span><strong>{Math.round(player.wins / player.played * 100)}%</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="lp-float-card lp-float-match">
        <span className="lp-float-icon"><Icon name="check" size={16} /></span>
        <span><strong>Match recorded</strong><small>Leaderboard updated</small></span>
      </div>
      <div className="lp-float-card lp-float-rank">
        <span className="lp-rank-glow"><Icon name="trophy" size={18} /></span>
        <span><strong>A new number one.</strong><small>The rivalry continues.</small></span>
      </div>
      <span className="lp-preview-caption">Illustrative product preview</span>
    </div>
  )
}

const steps = [
  { number: '01', icon: 'users', title: 'Bring your crew', description: 'Create a league, give it a name, and add the players who make every game interesting.' },
  { number: '02', icon: 'calendar', title: 'Play. Record. Repeat.', description: 'Start a season and save match results as the competition unfolds.' },
  { number: '03', icon: 'trophy', title: 'Watch the rivalry grow', description: 'Keep the leaderboard, player records, and match history together in one place.' },
]

function Features() {
  return (
    <section className="lp-section lp-features" id="features">
      <div className="lp-container">
        <div className="lp-section-intro">
          <div className="lp-kicker">EVERYTHING YOUR CREW NEEDS</div>
          <h2>Less scorekeeping.<br /><span>More bragging rights.</span></h2>
          <p>All the fun of the rivalry, without the scattered notes, forgotten scores, or “wait, who won last time?”</p>
        </div>
        <div className="lp-bento">
          <article className="lp-feature-card lp-feature-big">
            <span className="lp-feature-icon"><Icon name="chart" /></span>
            <h3>Standings that speak for themselves.</h3>
            <p>Wins, losses, and rankings, updated as you record results. Everyone knows who's on top and who's closing in.</p>
            <div className="lp-mini-standings" aria-hidden="true">
              <div className="lp-mini-standings-top"><span>SEASON STANDINGS</span><span>WINS</span></div>
              <div><span>01 <strong>Mika</strong></span><span className="lp-mini-bar"><i style={{ width: '88%' }} /></span><b>10</b></div>
              <div><span>02 <strong>Alex</strong></span><span className="lp-mini-bar"><i style={{ width: '72%' }} /></span><b>8</b></div>
              <div><span>03 <strong>Sam</strong></span><span className="lp-mini-bar"><i style={{ width: '61%' }} /></span><b>7</b></div>
            </div>
          </article>
          <article className="lp-feature-card lp-feature-score">
            <span className="lp-feature-icon"><Icon name="target" /></span>
            <h3>Record a match. Done.</h3>
            <p>Save the matchup and final score without slowing down the next game.</p>
            <div className="lp-score-widget" aria-hidden="true">
              <div><span className="lp-score-initial blue">A</span><strong>Alex</strong></div>
              <span className="lp-score-numbers">21 <em>:</em> 17</span>
              <div><span className="lp-score-initial violet">M</span><strong>Mika</strong></div>
            </div>
          </article>
          <article className="lp-feature-card lp-feature-private">
            <span className="lp-feature-icon"><Icon name="lock" /></span>
            <h3>Your league. Your call.</h3>
            <p>Keep the league private or make its leaderboard and results viewable through a link.</p>
            <div className="lp-visibility-widget" aria-hidden="true"><Icon name="shield" size={17} /><span>League visibility</span><strong>Private</strong><span className="lp-faux-switch"><i /></span></div>
          </article>
          <article className="lp-feature-card lp-feature-small">
            <span className="lp-feature-icon"><Icon name="users" /></span>
            <h3>Every player matters.</h3>
            <p>Keep player profiles and performance together, so nobody's best run gets forgotten.</p>
          </article>
          <article className="lp-feature-card lp-feature-small">
            <span className="lp-feature-icon"><Icon name="clock" /></span>
            <h3>Every match has a history.</h3>
            <p>Revisit past results and settle the “that's not how it happened” debates.</p>
          </article>
          <article className="lp-feature-card lp-feature-small">
            <span className="lp-feature-icon"><Icon name="calendar" /></span>
            <h3>One season at a time.</h3>
            <p>Organize competition into seasons and give your crew a fresh race to the top.</p>
          </article>
        </div>
      </div>
    </section>
  )
}

const questions = [
  { question: 'Do I need an account to explore Barkada League?', answer: 'No. You can check out the public demo league and see how the leaderboard and match history work without creating an account.' },
  { question: 'Can I keep my league private?', answer: 'Yes. New leagues can be private, and you can choose to make the leaderboard and results publicly viewable if you want to share them.' },
  { question: 'What can I track in a league?', answer: 'Create players and seasons, record match scores, and follow standings, player stats, and match history in one place.' },
  { question: 'Is it only for one sport?', answer: 'No. Barkada League is built around players and match scores, making it useful for lots of friendly head-to-head competitions.' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const primaryTo = user ? '/leagues' : '/signup'

  return (
    <div className="lp">
      <LandingHeader primaryTo={primaryTo} isSignedIn={Boolean(user)} />
      <main id="main">
        <section className="lp-hero">
          <div className="lp-hero-grid" aria-hidden="true" />
          <div className="lp-container lp-hero-content">
            <div className="lp-eyebrow"><span className="lp-eyebrow-dot" /> THE HOME OF FRIENDLY RIVALRIES <Icon name="spark" size={14} /></div>
            <h1>Every match counts.<br /><span>Every rivalry has a story.</span></h1>
            <p className="lp-hero-description">Create a league for your crew, record every result, and turn game nights into a leaderboard everyone wants to climb.</p>
            <div className="lp-hero-actions">
              <ActionLink to={primaryTo}>{user ? 'Go to my leagues' : 'Start your league'}</ActionLink>
              <ActionLink to="/demo" secondary>Explore the demo</ActionLink>
            </div>
            <div className="lp-hero-note"><Icon name="check" size={15} /> No score sheets. No lost results. Just the game.</div>
          </div>
          <div className="lp-container"><LeaderboardPreview /></div>
        </section>

        <section className="lp-sports" aria-label="Made for your kind of game">
          <div className="lp-container lp-sports-inner">
            <span>FOR THE GAMES THAT BRING YOU TOGETHER</span>
            <div className="lp-sports-list"><span>🏸 Badminton</span><span>🏓 Pickleball</span><span>🏀 Basketball</span><span>🎱 Billiards</span><span>+ your own rivalry</span></div>
          </div>
        </section>

        <section className="lp-section lp-steps" id="how-it-works">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-kicker">HOW IT WORKS</div>
              <h2>From “let's play” to<br /><span>“check the standings.”</span></h2>
              <p>Getting the crew organized shouldn't be harder than the game itself.</p>
            </div>
            <div className="lp-steps-grid">
              {steps.map((step) => (
                <article className="lp-step" key={step.number}>
                  <div className="lp-step-top"><span className="lp-step-number">{step.number}</span><span className="lp-step-icon"><Icon name={step.icon} size={24} /></span></div>
                  <h3>{step.title}</h3><p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Features />

        <section className="lp-section lp-demo-section">
          <div className="lp-container lp-demo-layout">
            <div className="lp-demo-copy">
              <div className="lp-kicker">SEE IT IN ACTION</div>
              <h2>Don't take our word for it.<br /><span>See the standings.</span></h2>
              <p>Take a look inside the Barkada Demo league. Browse the leaderboard, explore players, and see how matches become part of the story.</p>
              <ul className="lp-demo-bullets">
                <li><Icon name="check" size={16} /> No account needed to explore</li>
                <li><Icon name="check" size={16} /> See real app screens and match history</li>
                <li><Icon name="check" size={16} /> Start your own league when you're ready</li>
              </ul>
              <ActionLink to="/demo">Open the live demo</ActionLink>
            </div>
            <div className="lp-demo-graphic" aria-hidden="true">
              <div className="lp-demo-circle circle-one" /><div className="lp-demo-circle circle-two" />
              <div className="lp-demo-panel">
                <div className="lp-demo-panel-top"><span className="lp-demo-panel-badge"><Icon name="trophy" size={18} /></span><span><strong>Barkada Demo</strong><small>Public league</small></span><span className="lp-demo-public">VIEWABLE</span></div>
                <div className="lp-demo-panel-line"><span>Leaderboard</span><Icon name="arrow" size={17} /></div>
                <div className="lp-demo-panel-line"><span>Match history</span><Icon name="arrow" size={17} /></div>
                <div className="lp-demo-panel-line"><span>Player profiles</span><Icon name="arrow" size={17} /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-faq" id="faq">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-kicker">GOOD TO KNOW</div>
              <h2>Questions before<br /><span>the first match?</span></h2>
            </div>
            <div className="lp-faq-list">
              {questions.map(({ question, answer }) => (
                <details key={question} className="lp-faq-item">
                  <summary>{question}<span className="lp-faq-plus" aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="lp-container">
            <div className="lp-final-card">
              <span className="lp-final-spark spark-one" aria-hidden="true">✳</span>
              <span className="lp-final-spark spark-two" aria-hidden="true">✳</span>
              <div className="lp-final-kicker">THE NEXT GAME IS CALLING</div>
              <h2>Ready to settle<br />the score?</h2>
              <p>Give your crew a league of its own. Let the games do the talking.</p>
              <Link className="lp-final-button" to={primaryTo}>{user ? 'Go to my leagues' : 'Create your league'} <Icon name="arrow" size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div><Link className="lp-brand lp-footer-brand" to="/"><img src="/logo.png" alt="" width="34" height="34" />Barkada League</Link><p>Made for the games you never forget.</p></div>
          <nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#faq">FAQ</a><Link to="/demo">Explore demo</Link><Link to={user ? '/leagues' : '/login'}>{user ? 'My leagues' : 'Log in'}</Link></nav>
        </div>
      </footer>
    </div>
  )
}
