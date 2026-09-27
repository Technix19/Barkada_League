# Week 2

## Goal

My goal this week was to actually connect the pieces of Barkada League
together — React, Express, and PostgreSQL — so it would work as a real
full-stack app instead of a frontend that just looked done while running
on fake data in memory.

## What I did

I connected the Record Match and Edit Match forms to the real API
instead of the mock service they were using before, and hooked up
Match History's delete button to a real `DELETE` request too. On the
backend, I finished the CRUD routes for matches (create, read, update,
delete) and made sure they validate things like scores not being tied
and both players actually existing before touching the database.

The bigger part of the week was making the leaderboard and player
stats come from the database instead of being calculated by the
frontend off fake data. Wins, losses, win percentage, rank, and streak
are all worked out from the actual rows in the matches table every time
you ask for them — nothing about a player's stats is stored directly,
it's all recalculated from the match history.

I spent a good chunk of time just testing this end to end — recording a
match, checking it showed up correctly in Match History, checking the
leaderboard updated, checking the player's profile updated, then editing
that match and checking everything updated again, then deleting it and
checking it went back to how it was before.

## What blocked me

I mixed up my two `.env` files at one point and put the real database
connection string into the wrong one (the one that's actually tracked by
git instead of the one that's ignored). Caught it before it got
committed, but it was a good reminder that having two similarly-named
config files open at once is asking for that mistake.

The most confusing bug was a Postgres date issue — dates I got back from
the database were sometimes off by one day. It wasn't a bug in my code
exactly, it was that the database driver was turning a plain date into a
full JavaScript Date object using the server's local time zone, and that
shifted things depending on when/where it ran. Took me a while to
realize the fix wasn't in how I was displaying the date, it was in the
SQL query itself.

The other real blocker was a crash on the leaderboard page for any player
with zero matches. It didn't show up until I connected the real API,
because my mock/test data always had every player with at least one
match played. Once a player could legitimately have zero matches, a
line of code that assumed a streak object would always exist just broke.
That one was a good example of a bug that mock data was quietly hiding
the whole time.

## What I learned

This week made it a lot clearer to me how data actually moves through a
full-stack app: React sends an HTTP request, Express receives it and
runs a query, Postgres gives back rows, Express turns that into a JSON
response, and React updates the screen with it. Before this, I sort of
understood that in theory, but actually watching it break at each of
those steps (a bad date, a missing null check, a value being a string
when the backend expected a number) made it click in a way just reading
about REST APIs didn't.

I also learned that real data is a lot less forgiving than fake data.
My mock data was "nice" — every player always had matches, nothing was
ever null, nothing was ever a weird edge case. The real database didn't
care about that, and the bugs it exposed (the streak crash especially)
were bugs that had been sitting in my code the entire time without me
knowing, because I never gave it data messy enough to trigger them.

I used AI tools (documented in AI-USAGE.md) to help write a lot of the
actual backend and frontend code this week, but the debugging process
was still on me — reading the error, checking the request/response,
figuring out which layer (React, Express, or the database) the problem
was actually in, and deciding whether a suggested fix actually made
sense before accepting it. The date bug and the null-streak bug both
needed me to actually trace through what was happening rather than just
taking a fix at face value, since the first thing that looked like the
problem usually wasn't quite it.
