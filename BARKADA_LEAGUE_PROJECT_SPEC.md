# Barkada League — Complete Project Specification

> **Purpose of this document**
>
> This file is the source of truth for building **Barkada League** with Claude Code.
> Before implementing or changing a feature, read this document first.
>
> The goal is to build a clean, understandable final project using **React + Vite**, **Node.js + Express**, and **PostgreSQL**. The app should demonstrate the full flow from frontend state and forms, through a REST API, to relational database storage and derived statistics.
>
> **Do not add features that are not described here unless explicitly requested.**
> Prioritize a finished, understandable MVP over a larger but incomplete system.

---

# 1. Product Overview

## App name

**Barkada League**

The name may be changed visually later, but all code and documentation can use `Barkada League` as the working product name.

## One-sentence description

Barkada League is a web application for a small group of friends who regularly play the same 1v1 competitive game, allowing them to record match results and automatically track season standings, win rates, streaks, and individual player records.

## Core idea

The app should feel like a small private league tracker.

The most important distinction is that the **leaderboard is derived from match records**.

Users do **not** manually type:

- player rank
- number of wins
- number of losses
- win percentage
- current streak

Instead:

1. A match is recorded.
2. The match is stored in PostgreSQL.
3. The backend derives statistics from stored matches.
4. React requests the updated data.
5. The leaderboard and player statistics update automatically.

This derived-data behavior is the central feature of the project.

---

# 2. Target Users

The intended users are a **small barkada of approximately 6–10 regular players** who repeatedly play the same competitive 1v1 game.

Examples could include:

- a badminton group
- a chess group that only records decisive games
- a table tennis group
- a 1v1 video game group

However, the software is **not a multi-sport platform**.

A single deployed league represents one group playing one game.

The application does not need to contain rules for badminton, chess, table tennis, or any other specific sport. It simply stores two players and two numeric scores, then determines the winner from the higher score.

## Main user needs

A player opens Barkada League because they want to:

- record a match that just finished
- see who is currently leading the season
- see recent match results
- inspect one player's record and recent performance

---

# 3. Project Scope

## Required MVP

The MVP consists of four main user-facing routes:

1. **Leaderboard**
2. **Record Match**
3. **Match History**
4. **Player Profile**

The application must also include:

- reusable shared navigation
- season selection/filtering
- loading states
- empty states
- basic error handling
- responsive layouts
- PostgreSQL persistence
- Express REST API
- match edit/delete support
- seed data

## Scope philosophy

Keep the project intentionally small.

A complete, polished four-screen app is preferred over adding unnecessary features.

---

# 4. Explicit Non-Goals

Do **not** implement these in the MVP:

- authentication
- signup/login
- passwords
- multiple user accounts
- friend requests
- public league discovery
- multiple sports or game types
- team-vs-team matches
- tournament brackets
- real-time sockets
- chat
- push notifications
- profile-picture uploads
- cloud file storage
- AI predictions
- achievements
- betting
- payments
- social feeds
- advanced permissions
- external sports APIs
- Redux
- Firebase
- Next.js
- an ORM unless explicitly requested later

Do not introduce these merely because they seem useful.

Note on Supabase: Supabase is used only as the hosting provider for the PostgreSQL database (see §5, §23). Using Supabase this way is not a non-goal. What remains out of scope is treating Supabase as a backend-as-a-service — its client SDK, Auth, Storage, and Edge Functions are not used. The frontend must never talk to Supabase directly; all data access goes through the Express REST API.

---

# 5. Technology Stack

Use the following stack unless explicitly changed later.

## Frontend

- React
- Vite
- React Router
- native `fetch`
- plain CSS
- CSS custom properties for design tokens

Do not use Redux.

Local React state and component composition are sufficient for this project.

## Backend

- Node.js
- Express.js
- `pg` PostgreSQL driver
- `dotenv`
- CORS during local development

## Database

- PostgreSQL, hosted through Supabase
- SQL written directly rather than through an ORM
- Supabase is infrastructure/database hosting only — not the application backend. Express connects to it using the standard `pg` package like any other PostgreSQL server. The frontend never communicates with Supabase directly, and no Supabase SDK (client library, Auth, Storage, Edge Functions) is used.

## Development architecture

Recommended repository structure:

```text
barkada-league/
│
├── client/
│   ├── src/
│   └── package.json
│
├── server/
│   ├── src/
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── README.md
└── BARKADA_LEAGUE_PROJECT_SPEC.md
```

The frontend and backend should remain clearly separated.

---

# 6. Core User Flow

The most important application flow is:

```text
Player finishes a match
        ↓
User opens "Record Match"
        ↓
User selects Player 1 and Player 2
        ↓
User enters both scores
        ↓
User submits the form
        ↓
React sends POST /api/matches
        ↓
Express validates the request
        ↓
Express determines the winner
        ↓
PostgreSQL stores the match
        ↓
API returns the created match
        ↓
React redirects to or refreshes the leaderboard
        ↓
Leaderboard is recalculated from all season matches
        ↓
Updated standings are shown
```

This flow is the conceptual heart of Barkada League.

---

# 7. Routes and Screens

## Route 1 — Leaderboard

### URL

```text
/
```

or internally:

```text
/leaderboard
```

Prefer `/` as the primary public route.

### Purpose

Show the current standings for the selected season.

### Required content

- app header/navigation
- page title
- season selector
- leaderboard
- recent matches
- prominent "Record Match" button

### Leaderboard columns/data

Desktop:

- rank
- player
- wins
- losses
- matches played
- win percentage
- current streak

Mobile may show a simplified card layout.

### Example

```text
BARKADA LEAGUE

Season 1 ▼

LEADERBOARD

#   Player       W    L    Played   Win %   Streak
1   Lance        8    2      10      80%     W4
2   Josh         7    3      10      70%     W1
3   Mark         5    5      10      50%     L1
4   Alex         3    7      10      30%     L3

RECENT MATCHES

Lance        21 - 17       Josh
Alex         21 - 18       Mark
Lance        21 - 14       Mark

[ Record Match ]
```

### Behavior

- Default to the active/current season.
- Changing season reloads leaderboard and recent matches for that season.
- Clicking a player opens `/players/:id`.
- Recent matches should show the newest first.
- Show approximately 5 recent matches.

### Empty state

If there are players but no matches:

```text
No matches have been recorded for this season yet.
Record the first match to start the leaderboard.
```

---

## Route 2 — Record Match

### URL

```text
/matches/new
```

### Purpose

Record a newly completed match.

### Form fields

- season
- player 1
- player 1 score
- player 2
- player 2 score
- date played

### Default values

- season: active season
- date: current local date
- scores: blank

### Required validation

Client-side and server-side:

- season is required
- player 1 is required
- player 2 is required
- player 1 and player 2 cannot be the same
- scores are required
- scores must be integers
- scores must be zero or greater
- scores cannot be equal
- played date is required
- selected players must exist
- selected season must exist

### Winner logic

The client should **not** decide or send a trusted `winnerId`.

The server determines the winner:

```js
winnerId =
  player1Score > player2Score
    ? player1Id
    : player2Id
```

### Success behavior

After a successful save:

Option A, preferred:

```text
POST succeeds
→ redirect to leaderboard
→ leaderboard automatically reflects new result
```

A small success message may be shown.

### Failure behavior

Keep form values and display a readable error message.

Do not clear the user's form after a failed request.

---

## Route 3 — Match History

### URL

```text
/matches
```

### Purpose

Show all recorded matches for the selected season.

### Required content

- header/navigation
- page title
- season filter
- list of matches
- edit control
- delete control

### Ordering

Newest match first.

If two matches have the same `played_at`, sort by newest database ID first.

### Match display

Each record should clearly show:

- date
- player 1 name
- player 1 score
- player 2 score
- player 2 name
- winner indication

Example:

```text
September 1, 2026
Lance        21 - 17        Josh
Winner: Lance
```

### Edit behavior

Editing a match should allow changes to:

- season
- player 1
- player 2
- player 1 score
- player 2 score
- played date

Revalidate using the same rules as match creation.

### Delete behavior

Deleting a match must require a confirmation step.

Example:

```text
Delete this match?
This will also change leaderboard statistics.

[Cancel] [Delete]
```

After deletion, the history and leaderboard should reflect the removed record.

### Empty state

```text
No matches found for this season.
```

---

## Route 4 — Player Profile

### URL

```text
/players/:id
```

### Purpose

Show one player's derived performance statistics and recent matches.

### Required content

- back navigation
- player name
- nickname if present
- join date
- selected/current season
- statistics
- recent match history

### Required statistics

For the selected season:

- matches played
- wins
- losses
- win percentage
- current streak

Optional only if implementation remains simple:

- longest winning streak

Do not add graphs to the MVP unless all required functionality is already complete.

### Example

```text
← Leaderboard

LANCE
"Lan"
Joined July 2026

Season 1

8
Wins

2
Losses

10
Played

80%
Win Rate

W4
Current Streak

RECENT MATCHES

W    vs Josh      21-17
W    vs Mark      21-14
W    vs Alex      21-18
W    vs Josh      21-16
L    vs Mark      18-21
```

### Missing player

If `/players/:id` does not exist:

- return backend `404`
- frontend displays a proper "Player not found" state

---

# 8. Navigation

The same shared navigation should appear across all main screens.

Recommended desktop navigation:

```text
Barkada League

Leaderboard
Matches
Record Match
```

Player Profile does not need a permanent "Players" nav route because there is no separate player directory in the MVP.

Player profiles are reached from leaderboard rows and match records.

## Mobile navigation

The app must work at 375px width with no horizontal scrolling.

Possible implementation:

- compact header
- simple menu button
- stacked navigation

Do not spend excessive development time on elaborate navigation animations.

---

# 9. Database Model

Use three primary tables:

1. `players`
2. `seasons`
3. `matches`

This is enough for the MVP.

---

# 10. PostgreSQL Schema

## players

Suggested schema:

```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE
);
```

### Meaning

`name`
: Main display name.

`nickname`
: Optional secondary name.

`join_date`
: Date the player joined the barkada league.

---

## seasons

Suggested schema:

```sql
CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);
```

### Rules

- At least one seed season should be active.
- The application does not need a season-management screen in the MVP.
- Seasons may be created through seed SQL during development.
- `end_date` can be `NULL` for an ongoing season.

---

## matches

Suggested schema:

```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,

  season_id INTEGER NOT NULL
    REFERENCES seasons(id)
    ON DELETE RESTRICT,

  player1_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  player2_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  player1_score INTEGER NOT NULL
    CHECK (player1_score >= 0),

  player2_score INTEGER NOT NULL
    CHECK (player2_score >= 0),

  winner_id INTEGER NOT NULL
    REFERENCES players(id)
    ON DELETE RESTRICT,

  played_at DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (player1_id <> player2_id),
  CHECK (player1_score <> player2_score),
  CHECK (
    winner_id = player1_id
    OR winner_id = player2_id
  )
);
```

The backend is responsible for ensuring `winner_id` agrees with the scores.

Do not trust winner information from the frontend.

---

# 11. Database Relationships

```text
                   seasons
                     │
                     │ 1
                     │
                     │ many
                  matches
                 /   |   \
                /    |    \
               /     |     \
              v      v      v
          player1 player2 winner
               \     |     /
                \    |    /
                  players
```

A match:

- belongs to one season
- references two different players
- references one of those players as the winner

---

# 12. Database Indexes

The following indexes are reasonable:

```sql
CREATE INDEX idx_matches_season_id
ON matches(season_id);

CREATE INDEX idx_matches_played_at
ON matches(played_at DESC);

CREATE INDEX idx_matches_player1_id
ON matches(player1_id);

CREATE INDEX idx_matches_player2_id
ON matches(player2_id);
```

Keep indexing simple.

---

# 13. Seed Data

Create seed data so the application is useful immediately after setup.

Suggested players:

```text
Lance
Josh
Mark
Alex
Nico
Paolo
```

Nicknames may be added but are optional.

Suggested season:

```text
Season 1
start date: 2026-08-01
end date: null
is_active: true
```

Add approximately 10–15 sample matches distributed across the players.

The seed data should produce:

- different win/loss records
- at least one winning streak
- at least one losing streak
- no tied scores

Do not seed impossible match data.

---

# 14. REST API

All application API routes should begin with:

```text
/api
```

Responses should use JSON.

---

# 15. Player Endpoints

## GET /api/players

Return all players.

### Example response

```json
[
  {
    "id": 1,
    "name": "Lance",
    "nickname": "Lan",
    "joinDate": "2026-07-01"
  }
]
```

Preferred ordering:

```text
name ASC
```

---

## GET /api/players/:id

Return one player.

### 200

```json
{
  "id": 1,
  "name": "Lance",
  "nickname": "Lan",
  "joinDate": "2026-07-01"
}
```

### 404

```json
{
  "error": "Player not found"
}
```

---

## GET /api/players/:id/stats?seasonId=1

Return derived statistics for one player in one season.

### Example

```json
{
  "player": {
    "id": 1,
    "name": "Lance",
    "nickname": "Lan"
  },
  "seasonId": 1,
  "matchesPlayed": 10,
  "wins": 8,
  "losses": 2,
  "winPercentage": 80,
  "currentStreak": {
    "type": "W",
    "count": 4
  }
}
```

This endpoint may also return recent matches, or the frontend may request them separately.

Prefer whichever implementation remains easier to understand.

---

# 16. Season Endpoints

## GET /api/seasons

Return all seasons.

Suggested response:

```json
[
  {
    "id": 1,
    "name": "Season 1",
    "startDate": "2026-08-01",
    "endDate": null,
    "isActive": true
  }
]
```

Prefer active season first, followed by newest seasons.

---

## GET /api/seasons/active

Optional convenience endpoint.

Return the active season.

Do not build this if `GET /api/seasons` already makes the frontend simple.

---

# 17. Match Endpoints

## GET /api/matches?seasonId=1

Return matches for the selected season.

### Query behavior

- `seasonId` should be supported
- newest first
- include player display names through joins

### Example response

```json
[
  {
    "id": 12,
    "seasonId": 1,
    "playedAt": "2026-09-01",
    "player1": {
      "id": 1,
      "name": "Lance"
    },
    "player2": {
      "id": 2,
      "name": "Josh"
    },
    "player1Score": 21,
    "player2Score": 17,
    "winnerId": 1
  }
]
```

---

## GET /api/matches/:id

Return a single match.

Use this to populate an edit form.

---

## POST /api/matches

Create a match.

### Request

```json
{
  "seasonId": 1,
  "player1Id": 1,
  "player2Id": 2,
  "player1Score": 21,
  "player2Score": 17,
  "playedAt": "2026-09-01"
}
```

### Important

The request should not need to contain `winnerId`.

The Express backend determines the winner.

### Success

Use:

```text
201 Created
```

Return the created match.

### Validation failure

Use:

```text
400 Bad Request
```

Example:

```json
{
  "error": "Players must be different"
}
```

### Missing referenced player/season

A clear `400` or `404` may be used consistently.

Prefer readable application-level validation before PostgreSQL foreign-key errors reach the user.

---

## PATCH /api/matches/:id

Update a match.

The same validation rules as POST apply.

The backend must recalculate winner whenever scores or participants change.

### Success

Return the updated match.

### Missing match

```text
404 Not Found
```

---

## DELETE /api/matches/:id

Delete a match.

### Success

Preferred:

```text
204 No Content
```

### Missing match

```text
404 Not Found
```

---

# 18. Leaderboard Endpoint

## GET /api/leaderboard?seasonId=1

This is the most important derived-data endpoint.

It calculates standings from match records.

### Example response

```json
[
  {
    "rank": 1,
    "playerId": 1,
    "name": "Lance",
    "nickname": "Lan",
    "matchesPlayed": 10,
    "wins": 8,
    "losses": 2,
    "winPercentage": 80,
    "currentStreak": {
      "type": "W",
      "count": 4
    }
  },
  {
    "rank": 2,
    "playerId": 2,
    "name": "Josh",
    "nickname": null,
    "matchesPlayed": 10,
    "wins": 7,
    "losses": 3,
    "winPercentage": 70,
    "currentStreak": {
      "type": "W",
      "count": 1
    }
  }
]
```

---

# 19. Leaderboard Rules

The following rules define ranking.

## Matches played

```text
number of matches in the selected season where the player is player1 or player2
```

## Wins

```text
number of matches where winner_id = player.id
```

## Losses

```text
matchesPlayed - wins
```

Because MVP matches cannot tie:

```text
wins + losses = matchesPlayed
```

## Win percentage

```text
wins / matchesPlayed * 100
```

For zero matches:

```text
0%
```

Do not divide by zero.

## Ranking order

Use this order:

1. most wins
2. highest win percentage
3. most matches played
4. alphabetical player name

This creates deterministic standings.

The ranking system does not need Elo, points, strength of schedule, or advanced sports ranking logic.

## Players with zero matches

They should still appear on the leaderboard if they are registered players.

Example:

```text
Paolo
0 wins
0 losses
0 played
0%
```

They should naturally appear below players with wins.

---

# 20. Current Streak Rules

A streak is based on the player's most recent consecutive outcomes in the selected season.

Example outcomes newest first:

```text
W
W
W
L
W
```

Current streak:

```text
W3
```

Another example:

```text
L
L
W
W
```

Current streak:

```text
L2
```

If the player has no matches:

```text
—
```

or:

```text
0
```

Prefer `—` visually.

## How to calculate

For each player:

1. query or collect their matches in descending `played_at`
2. determine W/L for each
3. inspect the newest result
4. count consecutive results matching that newest result
5. stop when the result changes

Do not calculate streak from total wins/losses.

---

# 21. Backend Project Structure

Recommended:

```text
server/
└── src/
    ├── app.js
    ├── server.js
    ├── db.js
    │
    ├── routes/
    │   ├── players.js
    │   ├── seasons.js
    │   ├── matches.js
    │   └── leaderboard.js
    │
    ├── controllers/
    │   ├── playersController.js
    │   ├── seasonsController.js
    │   ├── matchesController.js
    │   └── leaderboardController.js
    │
    └── utils/
        └── validation.js
```

Do not introduce unnecessary service/repository layers unless the code becomes large enough to justify them.

For a student project, clarity is more important than enterprise architecture.

---

# 22. Express App Rules

`app.js` should configure the Express application.

Example responsibilities:

- `express.json()`
- CORS
- route mounting
- 404 handler
- central error handler

`server.js` should:

- import the app
- choose port
- call `app.listen()`

Do not call `listen()` inside modules that should be testable independently.

---

# 23. PostgreSQL Connection

Use a shared `Pool` from `pg`.

The database is hosted on Supabase. Express connects to it exactly like any other PostgreSQL server — through `pg`, using the connection string Supabase provides (Supabase Dashboard → Project → Connect → PostgreSQL connection string).

Environment variables use:

```env
DATABASE_URL=postgresql://...
```

This is the single supported pattern for this project (the separate `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` form described in earlier drafts is not used now that the connection string comes from Supabase).

Also:

```env
PORT=3001
```

Never commit real credentials.

Create:

```text
.env.example
```

---

# 24. API Error Format

Prefer consistent JSON errors.

Example:

```json
{
  "error": "Players must be different"
}
```

For unexpected server errors:

```json
{
  "error": "Internal server error"
}
```

Do not leak PostgreSQL stack traces to the frontend.

During development, logging the actual error on the server console is acceptable.

---

# 25. Frontend Project Structure

Recommended:

```text
client/
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── pages/
    │   ├── LeaderboardPage.jsx
    │   ├── RecordMatchPage.jsx
    │   ├── MatchHistoryPage.jsx
    │   ├── EditMatchPage.jsx
    │   └── PlayerProfilePage.jsx
    │
    ├── components/
    │   ├── atoms/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   └── Badge.jsx
    │   │
    │   ├── molecules/
    │   │   ├── MatchCard.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── LeaderboardRow.jsx
    │   │   └── FormField.jsx
    │   │
    │   └── organisms/
    │       ├── Header.jsx
    │       ├── LeaderboardTable.jsx
    │       ├── MatchForm.jsx
    │       └── RecentMatches.jsx
    │
    ├── api/
    │   └── api.js
    │
    ├── styles/
    │   ├── global.css
    │   └── variables.css
    │
    └── utils/
        ├── formatDate.js
        └── formatPercentage.js
```

This is a recommendation, not a requirement.

Avoid splitting tiny components solely to make the folder tree look sophisticated.

A component should exist because it is reused or has a clear responsibility.

---

# 26. React Router Setup

Recommended routes:

```jsx
<Route path="/" element={<LeaderboardPage />} />
<Route path="/matches" element={<MatchHistoryPage />} />
<Route path="/matches/new" element={<RecordMatchPage />} />
<Route path="/matches/:id/edit" element={<EditMatchPage />} />
<Route path="/players/:id" element={<PlayerProfilePage />} />
```

A shared layout may contain the header and `<Outlet />`.

Although the planning document describes four core screens, the edit route is a supporting route for full match CRUD and does not need to appear in the primary nav.

---

# 27. Frontend API Layer

Keep fetch calls centralized where practical.

Example functions:

```js
getPlayers()
getSeasons()
getMatches(seasonId)
getMatch(id)
createMatch(data)
updateMatch(id, data)
deleteMatch(id)
getLeaderboard(seasonId)
getPlayer(id)
getPlayerStats(id, seasonId)
```

Base API URL should come from a Vite environment variable:

```env
VITE_API_URL=http://localhost:3001/api
```

Do not hardcode the backend URL in every component.

---

# 28. Important React State

## LeaderboardPage

Likely state:

```text
seasons
selectedSeasonId
standings
recentMatches
loading
error
```

## RecordMatchPage

Likely state:

```text
players
seasons
formData
validationErrors
submitting
submitError
```

Possible `formData`:

```js
{
  seasonId: "",
  player1Id: "",
  player2Id: "",
  player1Score: "",
  player2Score: "",
  playedAt: ""
}
```

## MatchHistoryPage

Likely state:

```text
seasons
selectedSeasonId
matches
loading
error
matchPendingDelete
```

## PlayerProfilePage

Likely state:

```text
player
seasons
selectedSeasonId
stats
recentMatches
loading
error
```

State should live in the lowest component that actually needs to own it.

Do not make all state global by default.

---

# 29. Reusable Components

## Button

Props may include:

```text
variant
type
disabled
onClick
children
```

Variants:

- primary
- secondary
- danger

---

## FormField

Combines:

- label
- input/select
- validation message

Every form input must have an accessible label.

---

## MatchCard

Displays a match consistently across:

- leaderboard recent matches
- match history
- player profile

Props may include:

```text
match
compact
showActions
perspectivePlayerId
```

`perspectivePlayerId` is useful on player profiles so the component can show W/L relative to the viewed player.

---

## StatCard

Displays:

- value
- label

Example:

```text
8
Wins
```

---

## LeaderboardRow

Displays one player's standings.

Clicking the player name or row should navigate to the player profile.

If making the whole row clickable harms keyboard accessibility, keep a normal link on the player's name.

---

# 30. Loading States

Every screen that requests API data should show a deliberate loading state.

Simple text is acceptable:

```text
Loading leaderboard...
```

Avoid blank screens.

Do not add complex skeleton libraries unless needed.

---

# 31. Error States

Examples:

```text
Could not load the leaderboard.
Please try again.
```

```text
Could not save this match.
```

```text
Player not found.
```

Error messages should be understandable by a normal user.

Technical errors belong in the browser/server console during development.

---

# 32. Empty States

Deliberately design empty states.

## No matches

```text
No matches have been recorded yet.
```

## No recent matches for player

```text
This player has not played any matches this season.
```

## No seasons

This should not normally happen because seed data creates a season.

If it does:

```text
No season is available.
```

---

# 33. Match Form Validation Details

The backend is the final authority.

Client validation exists to provide faster feedback.

Validate:

### seasonId

- required
- numeric
- must refer to a valid season

### player1Id

- required
- numeric
- valid player

### player2Id

- required
- numeric
- valid player
- must differ from player1Id

### scores

- required
- numeric
- integers
- minimum 0
- cannot be equal

### playedAt

- required
- valid date

Optional rule:

- prevent future dates

This is reasonable but not mandatory.

If implemented, use local date semantics carefully.

---

# 34. Data Formatting

## Dates

Store dates in PostgreSQL using `DATE` for match played date.

Display in a friendly format.

Example:

```text
September 1, 2026
```

Avoid timezone bugs by not turning a date-only value into a midnight UTC timestamp unnecessarily.

## Win percentage

Display as a whole number unless decimals are actually useful.

Example:

```text
80%
```

If results require decimals:

```text
66.7%
```

Keep formatting consistent.

---

# 35. Design Direction

The final detailed visual design can be decided during implementation, but the app should feel:

- competitive
- clean
- modern
- friendly
- easy to scan
- more like a small sports dashboard than an enterprise admin panel

Avoid:

- excessive gradients
- glassmorphism everywhere
- neon gaming UI unless specifically requested
- overly dense dashboard layouts
- giant hero sections
- decorative animations that distract from data

The leaderboard should visually be the star of the product.

---

# 36. CSS / Design Tokens

Use CSS custom properties in `:root`.

Suggested token categories:

```css
:root {
  --color-primary: ...;
  --color-accent: ...;
  --color-bg: ...;
  --color-surface: ...;
  --color-text: ...;
  --color-muted: ...;
  --color-border: ...;
  --color-danger: ...;

  --font-size-sm: ...;
  --font-size-base: ...;
  --font-size-lg: ...;
  --font-size-xl: ...;

  --space-1: ...;
  --space-2: ...;
  --space-3: ...;
  --space-4: ...;
  --space-6: ...;
  --space-8: ...;

  --radius-sm: ...;
  --radius-md: ...;
  --radius-lg: ...;
}
```

Use an 8px-based spacing rhythm when practical.

Exact colors can be finalized after the functional app exists.

---

# 37. Accessibility Requirements

The app must use semantic HTML.

Use:

```text
<header>
<nav>
<main>
<section>
<form>
<label>
<button>
<table>
```

where appropriate.

Requirements:

- all form inputs have labels
- buttons are actual `<button>` elements
- navigation uses links
- keyboard navigation works
- visible focus states
- sufficient color contrast
- no horizontal scrolling at 375px
- tables should remain readable or transform appropriately on small screens

Do not make generic `<div>` elements behave like buttons unless necessary.

---

# 38. Responsive Behavior

Support at minimum:

- phone around 375px
- tablet
- desktop

## Desktop leaderboard

A table is appropriate.

## Mobile leaderboard

Avoid forcing a wide table to overflow horizontally.

Preferred approaches:

- transform each leaderboard entry into a stacked card
- or hide lower-priority columns while keeping core statistics visible

Core mobile data:

- rank
- name
- wins/losses
- win percentage
- streak

## Forms

Desktop:

- fields may use two-column grouping

Mobile:

- stack fields vertically
- controls use full available width

## Navigation

Desktop:

- horizontal links

Mobile:

- compact menu or stacked links

---

# 39. Suggested Desktop Leaderboard Layout

```text
┌──────────────────────────────────────────────────────┐
│ Barkada League       Leaderboard Matches Record Match│
├──────────────────────────────────────────────────────┤
│                                                      │
│ LEADERBOARD                        [ Season 1 ▼ ]     │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ #  Player      W   L   Played   Win %   Streak  │ │
│ │ 1  Lance       8   2    10       80%      W4    │ │
│ │ 2  Josh        7   3    10       70%      W1    │ │
│ │ 3  Mark        5   5    10       50%      L1    │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ RECENT MATCHES                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Lance                21 - 17              Josh   │ │
│ │ Alex                 21 - 18              Mark   │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│                                   [ Record Match ]   │
└──────────────────────────────────────────────────────┘
```

---

# 40. Suggested Mobile Leaderboard Layout

```text
┌──────────────────────┐
│ Barkada League     ☰ │
├──────────────────────┤
│                      │
│ LEADERBOARD           │
│ [ Season 1 ▼ ]        │
│                      │
│ ┌──────────────────┐ │
│ │ 🥇 Lance         │ │
│ │ 8W · 2L · 80%    │ │
│ │ Streak: W4       │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ 🥈 Josh          │ │
│ │ 7W · 3L · 70%    │ │
│ │ Streak: W1       │ │
│ └──────────────────┘ │
│                      │
│ RECENT MATCHES       │
│ ...                  │
│                      │
│ [ Record Match ]     │
└──────────────────────┘
```

The medal emoji is illustrative only. It may be replaced by styled rank badges.

---

# 41. Suggested Record Match Layout

```text
┌──────────────────────────────────────────┐
│ RECORD MATCH                             │
│                                          │
│ Season                                   │
│ [ Season 1 ▼ ]                           │
│                                          │
│ Player 1              Player 2           │
│ [ Lance ▼ ]           [ Josh ▼ ]         │
│                                          │
│ Score                 Score              │
│ [ 21 ]                [ 17 ]             │
│                                          │
│ Date                                     │
│ [ 2026-09-01 ]                           │
│                                          │
│                  [ Save Match ]           │
└──────────────────────────────────────────┘
```

On mobile, everything stacks vertically.

---

# 42. Suggested Match History Layout

```text
MATCH HISTORY                           [Season 1 ▼]

September 1, 2026
Lance                    21 - 17                Josh
Winner: Lance                         [Edit] [Delete]

August 29, 2026
Alex                     21 - 18                Mark
Winner: Alex                          [Edit] [Delete]
```

A card/list layout is preferred over a dense database-looking table if it improves mobile behavior.

---

# 43. Suggested Player Profile Layout

```text
← Leaderboard

LANCE
"Lan"
Joined July 2026

[ Season 1 ▼ ]

┌────────────┐ ┌────────────┐
│     8      │ │     2      │
│    Wins    │ │   Losses   │
└────────────┘ └────────────┘

┌────────────┐ ┌────────────┐
│    80%     │ │     W4     │
│  Win Rate  │ │   Streak   │
└────────────┘ └────────────┘

RECENT MATCHES

W  vs Josh      21 - 17
W  vs Mark      21 - 14
W  vs Alex      21 - 18
L  vs Mark      18 - 21
```

---

# 44. Match CRUD Expectations

Matches are the main CRUD resource.

## Create

Record Match form.

## Read

Match History and leaderboard recent matches.

## Update

Edit Match route.

## Delete

Delete action from Match History.

This gives the final project a clear demonstration of RESTful CRUD.

---

# 45. HTTP Status Code Expectations

Use sensible status codes.

```text
200 OK
201 Created
204 No Content
400 Bad Request
404 Not Found
500 Internal Server Error
```

Examples:

```text
GET successful            → 200
POST match successful     → 201
PATCH match successful    → 200
DELETE match successful   → 204
invalid match             → 400
missing player/match      → 404
unexpected DB failure     → 500
```

---

# 46. SQL / Derived Data Philosophy

Do not store values that can be reliably derived from match records unless there is a strong reason.

Do not create database columns for:

- wins
- losses
- win percentage
- rank
- current streak

Those are derived values.

The match table is the source of truth.

This prevents stale leaderboard values.

---

# 47. Data Integrity Rules

The system must never save a match where:

```text
player1 == player2
```

or:

```text
player1_score == player2_score
```

or:

```text
score < 0
```

or:

```text
winner is not one of the players
```

The server should validate input before executing the INSERT/UPDATE.

The database should also contain basic constraints as a second layer.

---

# 48. Development Sequence

Claude Code should build the project incrementally.

Do not attempt to create the entire finished application in one enormous pass.

## Phase 1 — Project setup

- create repository structure
- initialize server package
- initialize Vite React client
- install minimal dependencies
- create `.env.example`
- verify client and server both start

### Completion condition

```text
React development page loads.
Express health route responds.
```

---

## Phase 2 — PostgreSQL

- create database schema
- create seed SQL
- configure `pg`
- verify connection

Add a simple route if useful:

```text
GET /api/health
```

Example:

```json
{
  "status": "ok"
}
```

### Completion condition

Seeded players, season, and matches exist in PostgreSQL.

---

## Phase 3 — Read endpoints

Implement:

```text
GET /api/players
GET /api/seasons
GET /api/matches
GET /api/matches/:id
GET /api/players/:id
```

Test them before React integration.

---

## Phase 4 — Match create/update/delete

Implement:

```text
POST /api/matches
PATCH /api/matches/:id
DELETE /api/matches/:id
```

Include validation.

Test all error cases.

---

## Phase 5 — Leaderboard

Implement:

```text
GET /api/leaderboard?seasonId=...
```

Calculate:

- wins
- losses
- matches played
- win percentage
- rank

Then add streak calculation.

### Completion condition

Adding/deleting/editing a match changes the returned standings correctly.

---

## Phase 6 — React shell and routing

Build:

- shared header
- router
- placeholder pages

Verify navigation.

---

## Phase 7 — Leaderboard frontend

Connect React to:

- seasons
- leaderboard
- matches

Build the complete home screen.

This is the highest-priority frontend screen.

---

## Phase 8 — Record Match frontend

Build:

- match form
- player selectors
- scores
- date
- validation
- POST request
- successful redirect

---

## Phase 9 — Match History frontend

Build:

- season filter
- match list
- delete confirmation
- delete request

Then implement Edit Match.

---

## Phase 10 — Player Profile

Build:

- player info
- season filter
- stats
- recent matches

---

## Phase 11 — Styling and responsive layout

Once functionality is stable:

- define design tokens
- finalize colors
- improve typography
- spacing
- cards
- leaderboard hierarchy
- responsive behavior
- 375px testing

---

## Phase 12 — Polish

Add:

- loading states
- empty states
- friendly errors
- accessibility
- confirmation UI
- small UX improvements

---

# 49. Testing Checklist

Formal automated testing is optional unless required by the course, but manually verify all of the following.

## Match creation

- valid match saves
- same player fails
- tied score fails
- blank score fails
- negative score fails
- nonexistent player fails
- nonexistent season fails

## Match editing

- score changes winner correctly
- swapping participants behaves correctly
- invalid changes fail
- missing match gives 404

## Match deletion

- confirmation appears
- deletion works
- deleted match disappears
- leaderboard changes appropriately

## Leaderboard

- counts wins correctly
- counts losses correctly
- zero-match player appears
- percentage calculation is correct
- rank ordering is correct
- season filter works
- new match updates standings

## Streak

Test:

```text
W W W L → W3
L L W W → L2
W → W1
no matches → —
```

Remember order is newest match first.

## UI

- no horizontal scrolling at 375px
- form labels are present
- keyboard can reach controls
- loading is visible
- empty states are visible
- errors are readable

---

# 50. Acceptance Criteria

The MVP is considered complete when a user can:

1. open the application
2. view the current season leaderboard
3. change the selected season
4. view recent matches
5. click a player and view their stats
6. open Record Match
7. choose two different players
8. enter valid scores
9. save a match
10. return to the leaderboard and see updated standings
11. open Match History
12. edit a match
13. delete a match with confirmation
14. see all derived statistics update after edits/deletions
15. use the application comfortably on desktop and a 375px-wide phone

Additionally:

- data survives server restarts because it is stored in PostgreSQL
- frontend communicates with Express through HTTP
- Express communicates with PostgreSQL through SQL
- leaderboard values are derived rather than manually stored
- code is organized and understandable

---

# 51. Definition of Done for Each Feature

Do not call a feature complete simply because the happy path works.

A feature is complete when:

- primary UI exists
- API integration works
- loading state exists
- error state exists
- empty state exists where relevant
- validation exists
- mobile layout is usable
- no obvious console errors remain

---

# 52. README Requirements

At the end, create a README that includes:

## Project description

What Barkada League does.

## Tech stack

- React
- Vite
- Express
- PostgreSQL

## Prerequisites

- Node.js
- PostgreSQL

## Installation

Example:

```bash
git clone ...
cd barkada-league
```

Install frontend and backend dependencies.

## Environment setup

Explain `.env`.

## Database setup

Explain:

```text
schema.sql
seed.sql
```

## Running locally

Show commands for frontend and backend.

## Core features

Brief list.

## API overview

Brief endpoint list.

---

# 53. Coding Style Guidance for Claude Code

The project is intended to be understandable by a student learning the stack.

Therefore:

- prefer clear code over clever code
- prefer explicit names
- avoid unexplained abstractions
- avoid unnecessary dependencies
- avoid large utility frameworks
- keep functions focused
- comment only where logic is not self-evident
- do not generate enterprise-style architecture
- do not introduce TypeScript unless requested
- do not introduce a state-management library unless requested
- do not introduce an ORM unless requested
- do not introduce authentication unless requested

If there are two viable implementation choices, prefer the one that is easier to explain in a classroom project presentation.

---

# 54. Claude Code Working Rules

When Claude Code works on this project, it should follow these rules.

## Before making a major change

1. Read this spec.
2. Inspect the existing project.
3. Preserve working functionality.
4. Make the smallest coherent change needed.

## While coding

- Do not silently change product requirements.
- Do not add features outside MVP.
- Do not redesign database tables without explaining why.
- Do not replace the chosen stack.
- Do not invent routes/screens that are not needed.
- Do not duplicate logic unnecessarily.
- Keep backend validation authoritative.
- Keep derived stats derived from match data.

## After coding

For each implementation step:

1. summarize files changed
2. explain what was implemented
3. mention how to run/test it
4. report any unresolved issue
5. do not claim something works if it was not verified

---

# 55. Key Product Decisions Already Made

These decisions should be treated as settled unless explicitly changed.

### Product type

Small private 1v1 league tracker.

### Audience

One barkada of regular players.

### Number of core routes

Four user-facing core screens.

### Main CRUD resource

Matches.

### Ranking data

Derived from match records.

### Draws

Not supported in MVP.

### Teams

Not supported.

### Multiple sports

Not supported.

### Accounts/authentication

Not supported.

### Database

PostgreSQL, hosted through Supabase. Express connects via the standard `pg` package; the frontend never talks to Supabase directly, and no Supabase SDK is used.

### Backend

Express.

### Frontend

React + Vite.

### Client HTTP

Native fetch.

### State management

Local React state.

### Styling

Plain CSS with reusable design tokens.

### Mobile support

Required.

---

# 56. Why This Project Exists Academically

The app is intentionally designed to demonstrate the major parts of a full-stack web-development course.

## JavaScript

Used for:

- transformations
- validation
- event handlers
- data formatting
- statistics logic where appropriate

## React

Used for:

- components
- props
- state
- forms
- routing
- API-driven rendering
- conditional loading/error/empty states

## Styling and design

Used for:

- reusable visual tokens
- responsive layout
- accessible forms
- reusable UI components
- desktop/mobile adaptation

## Node + Express

Used for:

- HTTP server
- routing
- request parsing
- validation
- REST API
- error handling

## REST

Demonstrated through:

```text
GET
POST
PATCH
DELETE
```

especially on the match resource.

## PostgreSQL

Used for:

- persistent storage
- relational data
- foreign keys
- joins
- aggregation
- derived statistics

## Full-stack integration

The primary learning loop is:

```text
React
  ↓ fetch
Express API
  ↓ SQL
PostgreSQL
  ↑ rows
Express API
  ↑ JSON
React
```

The finished app should make that relationship easy to explain during a project presentation.

---

# 57. Future Enhancements — Only After MVP

These are ideas for later and are **not current requirements**.

Possible enhancements:

- player management screen
- season management screen
- performance chart
- head-to-head statistics
- longest winning streak
- overall career statistics across seasons
- season champions archive
- custom game/league name
- dark mode
- export results

Only consider these after every acceptance criterion in the MVP has been completed.

---

# 58. Final Product Summary

Barkada League should ultimately behave like this:

A user opens the app and immediately sees who is leading their current barkada season.

They can record a finished 1v1 match in a few seconds.

The match is persisted in PostgreSQL.

The backend automatically derives the new standings.

The leaderboard updates without anyone manually maintaining win/loss totals.

Users can inspect match history, correct or delete mistaken entries, and view individual player performance.

The entire application remains intentionally small, responsive, understandable, and demonstrative of the React → Express → PostgreSQL full-stack workflow.

---

# 59. First Instruction to Claude Code

When beginning implementation, use this exact priority:

> Read `BARKADA_LEAGUE_PROJECT_SPEC.md` completely. Inspect the current repository before writing code. Do not attempt to build the entire project at once. Begin with Phase 1 only: establish the client/server project structure, install only the dependencies required for that phase, create the minimal Express app and React Vite app, add environment-example files where needed, and verify that both sides run. Before moving to Phase 2, summarize what you created and how it maps to this specification.

---

**End of Barkada League Project Specification**
