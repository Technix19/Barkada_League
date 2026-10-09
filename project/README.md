## My project repository

Public repository: https://github.com/Technix19/Barkada_League

Live app (if deployed): https://barkada-league.vercel.app

## What it is

Barkada League is a season leaderboard for a small group of friends who play
the same 1v1 game — it records matches and works out standings, win
percentage, and streaks automatically instead of by hand.

## How to run it

```bash
# 1. clone the repo, then install both the frontend and backend dependencies
git clone https://github.com/Technix19/Barkada_League.git
cd Barkada_League
npm install
npm run server:install

# 2. set up the environment files from the example templates
cp .env.example .env                # root — VITE_API_URL=http://localhost:3001
cp server/.env.example server/.env  # server — PORT=3001, DATABASE_URL=<your own Postgres connection string>

# 3. create the schema and seed data against your own PostgreSQL database
#    (a free Supabase project works, or any Postgres you have a connection
#    string for), in this order, using the Supabase SQL Editor, psql, or any
#    Postgres client:
#    - database/schema.sql
#    - database/seed.sql   (adds 6 players, 1 season, 15 sample matches)

# 4. run the backend and frontend in two terminals
npm run dev:server   # http://localhost:3001
npm run dev          # http://localhost:5173
```

`DATABASE_URL` is never committed — only a placeholder like
`postgresql://YOUR_SUPABASE_CONNECTION_STRING` goes in `.env.example`. See
the root [README.md](../README.md) for the full environment variable table,
API route list, and deployment steps.

## Presentation

- Video (public Google Drive link): https://drive.google.com/file/d/1ukJjqWWlt9BiXDnd4RGam--3MfiwoI9Q/view?usp=sharing
- Slides (link or PDF): https://canva.link/1ti5qcih8flnymj
- Square image: https://drive.google.com/file/d/17jsKCtJmpyloCJ9_iKRbh_1Y0mqFUpvQ/view?usp=sharing

## AI usage

Link to the AI-USAGE.md in my project repository:
https://github.com/Technix19/Barkada_League/blob/main/AI-USAGE.md
