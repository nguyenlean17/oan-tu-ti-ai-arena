# Oẳn Tù Tì 2.0
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React and Vinext on Cloudflare Workers, D1 persistence, isolated browser Python practice runner. The original board-game engine is reused from the supplied GitHub repository.

## Users
Vietnamese students writing Python strategy bots, and tournament organizers reviewing submissions and running competitions.

## Product Purpose
Turn the existing 9×9 Oẳn Tù Tì board game into a programming competition: learn the API, submit a versioned bot, practice, inspect replays, and join tournaments.

## Positioning
Python strategies compete on the same 9×9 board and shared rules as the existing network-programming game.

## Operating Context
Students work with Python files, SDK examples, legal moves, match histories and competition rankings. Repository: https://github.com/nguyenlean17/network-programming.

## Capabilities and Constraints
The Play section supports human hotseat/free play, human vs built-in strategies, human vs an owned/draft Python bot, and server-authoritative friend rooms with invite links. Friend games use the existing Site audience; invitations do not grant access. Python human opponents run in a persistent isolated worker with a 2-second move limit. These casual games never affect official rankings.
Reuse FRONTLINE placement, P1 goal I1, P2 goal A9, king moves and ROCK/PAPER/SCISSORS capture rules. Proposed tournament defaults: maximum 200 plies, side-swapped fixtures, 3/1/0 scoring. Cloud records persist in D1. Browser-run Python practice results are untrusted and cannot become official scores. Official submitted-bot tournament execution requires the supplied external sandbox runner. The hosted app must clearly distinguish practice, reference-bot exhibition, and official results.

## Brand Commitments
Vietnamese-first. User delegates visual decisions. Respect the original project's crisp, solid-color, no-gradient design. Preserve its multiplayer game.

## Evidence on Hand
The 9-page proposal PDF and existing repository engine, tests, and README. No real entrants, prizes, or official event dates have been supplied. Seeded examples must be labeled.

## Product Principles
Make writing and testing a first bot immediate. Keep results reproducible and inspectable. Never execute student Python inside the web server. Do not invent participation or official results.
